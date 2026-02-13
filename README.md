# El Diario de Avisos

**El Diario de Avisos** is a comprehensive digital archive and semantic search platform designed to preserve and make accessible historical publications, essays, and articles. The project modernizes a legacy database system into a performant, vector-enabled web application.

[![CI](https://github.com/anyulled/el-diario-de-avisos/actions/workflows/ci.yml/badge.svg)](https://github.com/anyulled/el-diario-de-avisos/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=anyulled_el-diario-de-avisos&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=anyulled_el-diario-de-avisos)
[![codecov](https://codecov.io/gh/anyulled/el-diario-de-avisos/branch/main/graph/badge.svg)](https://codecov.io/gh/anyulled/el-diario-de-avisos)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/anyulled/el-diario-de-avisos)

## 📂 Project Structure

- **`web/`**: The modern Next.js web application. Handles the UI, database queries via Drizzle ORM, and AI/Vector search logic.
- **`scripts/`**: Utilities for extracting and transforming data from legacy MDB (Microsoft Access) files into a format suitable for PostgreSQL.
- **`data/`**: Intermediate storage for extracted CSVs and SQL dumps.
- **`music/`**: Assets for the application's audio playback features.
- **`docs/`**: Technical documentation and Architecture Decision Records (ADRs).

## 🤖 AI Assistant Rules

Follow the mandatory [Verification Policy](file:///Users/alrs/Documents/el-diario-de-avisos/PROJECT_RULES.md) before reporting any task as complete. Assistants must pass `type-check` and `lint` project-wide.

## ✨ Key Features

- **Historical Search**: Full-text and semantic search across 19th-century articles.
- **AI Historian**: RAG-powered chatbot that answers questions based on archive content.
- **Essays & Collections**: Curated essays linking to relevant historical articles.
- **Audio Experience**: Background music playback for immersive reading.

## 🏗️ Architecture

The system utilizes a Next.js App Router architecture integrated with a vector-capable PostgreSQL database for semantic search capabilities.

```mermaid
graph TD
    Client[Web Browser]

    subgraph Frontend [Next.js Web App]
        Pages[App Router Pages]
        Components[Shadcn/UI Components]
        Providers[Context Providers]
    end

    subgraph BackendLayer [Server Actions & Libs]
        ServerActions[Server Actions]
        VectorStore[Vector Store Lib]
        DrizzleClient[Drizzle Client]
    end

    subgraph Persistence [PostgreSQL + pgvector]
        RelationalData["Relational Data<br/>(Articles, Authors)"]
        VectorData["Vector Embeddings<br/>(768 dims)"]
    end

    subgraph Pipeline [Data Ingestion Pipeline]
        Legacy[Legacy MDB Files]
        Shell[Bash Scripts]
        Python[Python Processing]
        IngestScript[Vector Ingest Script]
    end

    Client --> Pages
    Pages --> ServerActions
    ServerActions --> DrizzleClient
    ServerActions --> VectorStore

    DrizzleClient --> RelationalData
    VectorStore --> VectorData

    Legacy --> Shell
    Shell --> Python
    Python --> RelationalData
    RelationalData --> IngestScript
    IngestScript --> VectorData
```

## 🗄️ Database Schema

The database is fully normalized and managed via Drizzle ORM. Below is a simplified Entity-Relationship Diagram (ERD) of the core modules.

```mermaid
erDiagram
    PUBLICATIONS ||--o{ ISSUES : "publishes"
    ISSUES ||--o{ ARTICLES : "contains"
    AUTHORS ||--o{ ARTICLES : "writes"

    ARTICLES ||--o{ ARTICLE_TOPICS : "classified by"
    SUBJECTS ||--o{ ARTICLE_TOPICS : "defines"

    ARTICLES ||--o{ ARTICLE_IMAGES : "includes"
    IMAGES ||--o{ ARTICLE_IMAGES : "displayed in"

    ARTICLES ||--o| ARTICLE_EMBEDDINGS : "has vector"

    MEMBERS ||--o{ ESSAYS : "authors"
    ESSAYS ||--o{ ESSAY_ARTICLES : "links to"
    ARTICLES ||--|{ ESSAY_ARTICLES : "linked from"

    ARTICLES {
        int id PK
        varchar title
        varchar date "YYYY-MM-DD"
        bytea content "RTF/Text"
        boolean isEditable
    }

    AUTHORS {
        int id PK
        varchar name
        varchar reference
    }

    PUBLICATIONS {
        int id PK
        varchar name
        timestamp foundedDate
    }

    ISSUES {
        int id PK
        varchar number
        timestamp date
    }

    SUBJECTS {
        int id PK
        varchar name
        boolean isSubject
    }

    ARTICLE_EMBEDDINGS {
        int articleId FK
        vector embedding "768 dim"
    }
```

## 🔍 Full-Text Search

The application implements PostgreSQL's native full-text search with Spanish language support, indexing **full article content** for comprehensive search coverage.

### Features

- **Content Indexing**: Searches across full article content, not just titles
- **RTF Stripping**: Automatically removes RTF formatting for clean text indexing
- **Spanish Language Support**: Uses PostgreSQL's `spanish` text search configuration for proper stemming and stop words
- **Accent-Insensitive**: Searches for "musica" will find "MÚSICA" automatically
- **Relevance Ranking**: Results sorted by `ts_rank` score with weighted fields
- **High Performance**: GIN index enables sub-second searches across thousands of articles
- **Automatic Updates**: Trigger-based search vector maintenance requires no manual intervention

### How It Works

The search functionality indexes article titles and **full content** in a `tsvector` column with weighted priorities:

- **Title** (weight 'A'): Highest priority - exact title matches rank first
- **Content** (weight 'C'): Lower priority - content matches rank after title matches

**RTF Processing**: Article content is stored as RTF or plain text in `bytea` format. Before indexing, a PostgreSQL function (`strip_rtf_content`) automatically:

1. Decodes from Windows-1252 encoding
2. Detects RTF vs plain text format
3. Removes RTF control words (`\rtf1`, `\ansi`, etc.)
4. Removes RTF hex sequences (`\'e1` for accented characters)
5. Normalizes whitespace
6. Returns clean, searchable text

When you search, PostgreSQL:

1. Converts your query to a `tsquery` using Spanish stemming
2. Matches against the indexed `search_vector` using the `@@` operator
3. Ranks results by relevance using `ts_rank`
4. Returns sorted results with most relevant first

### Benefits

| Feature                | Coverage                   |
| ---------------------- | -------------------------- |
| **Articles Indexed**   | 9,911 / 9,911 (100%)       |
| **Content Searchable** | Full article text          |
| **RTF Handling**       | Automatic stripping        |
| **Performance**        | Sub-second searches        |
| **Language Support**   | Spanish stemming & accents |

### Technical Implementation

The search vector is automatically maintained via a PostgreSQL trigger:

```sql
CREATE TRIGGER articulos_search_vector_trigger
BEFORE INSERT OR UPDATE OF arti_titulo, arti_contenido
ON articulos
FOR EACH ROW EXECUTE FUNCTION articulos_search_vector_update();
```

The trigger function combines title and cleaned content with weights:

```sql
NEW.search_vector :=
  setweight(to_tsvector('spanish', coalesce(NEW.arti_titulo, '')), 'A') ||
  setweight(to_tsvector('spanish', strip_rtf_content(NEW.arti_contenido)), 'C');
```

### Migration

To set up full-text search on a new database:

```bash
cd web
npx tsx scripts/migrate-search.ts
```

This will:

- Add the `search_vector` column
- Create the GIN index
- Create the RTF stripping function
- Set up the trigger function
- Populate search vectors for existing articles

## 🤖 Vector Embeddings & RAG

The application implements **Retrieval-Augmented Generation (RAG)** using a **Hybrid Search** approach that combines:

1. **Vector Search**: Semantic understanding using Google's `text-embedding-004` (768 dims).
2. **Keyword Search**: Precise matching using PostgreSQL's `unaccent` and `tsvector` (see [ADR-001](docs/adr/001-hybrid-search-and-unaccent.md)).
3. **LLM Generation**: Answers are synthesized by **Llama 3** (via Groq) using the retrieved context.

This ensures the chatbot can answer questions about specific people (e.g., "José ánjel Montero") even if the semantic embedding is slightly off, while still handling abstract queries.

### What is the Ingestion Script?

The `npm run ingest` command runs a vector embedding generation pipeline that:

1. **Identifies unprocessed articles** - Finds articles without embeddings (up to 500 per run)
2. **Processes RTF content** - Converts RTF to clean plain text with proper character encoding
3. **Generates AI embeddings** - Creates 768-dimensional vector representations using Google's `text-embedding-004` model
4. **Stores in database** - Saves embeddings to the `article_embeddings` table for semantic search

### How It Works

```mermaid
graph LR
    A[Articles Table] -->|Find unprocessed| B[RTF Processing]
    B -->|Clean text| C[Batch Processing]
    C -->|100 articles/batch| D[Google AI API]
    D -->|768-dim vectors| E[article_embeddings Table]
    E -->|Enable| F[Semantic Search]
```

**Processing Pipeline:**

1. **RTF to Plain Text** (`processRtf` function):
   - Decodes Windows-1252 encoding for special characters (accents, ñ, etc.)
   - Detects RTF format vs plain text
   - Converts RTF escape sequences (e.g., `\'e1` → 'á')
   - Strips HTML tags
   - Combines title + content (max 8000 chars)

2. **Embedding Generation** (`generateEmbeddingsBatch`):
   - Processes in batches of 100 to respect API rate limits
   - Uses Google Generative AI `text-embedding-004` model
   - Returns 768-dimensional vectors representing semantic meaning

3. **Database Storage**:
   - Stores vectors in `article_embeddings` table
   - Uses `pgvector` extension for efficient vector operations
   - Handles conflicts with `onConflictDoUpdate` (safe to re-run)

### When to Run

Run the ingestion script when:

- **After importing new articles** - New articles need embeddings for semantic search
- **After database restoration** - Embeddings may be missing after restoring from backup
- **To update existing embeddings** - Re-run to regenerate embeddings with improved models

```bash
cd web
npm run ingest
```

The script is **idempotent** - it only processes articles without embeddings, so it's safe to run multiple times.

### Requirements

- **Environment Variable**: `GEMINI_KEY` in `.env`
- **Database Extension**: PostgreSQL with `pgvector` extension enabled
- **Network Access**: Requires internet connection to call Google AI API

### Performance

| Metric                   | Value                         |
| ------------------------ | ----------------------------- |
| **Batch Size**           | 100 articles per API call     |
| **Max Articles per Run** | 500 articles                  |
| **Embedding Dimensions** | 768                           |
| **Processing Time**      | ~2-5 seconds per 100 articles |

### Semantic Search Benefits

Vector embeddings enable searches like:

- **Conceptual matching**: Search "obituary" finds articles about "necrología"
- **Multilingual understanding**: Handles Spanish and English semantic similarity
- **Context awareness**: Understands phrases and context, not just keywords
- **Typo tolerance**: Similar vectors even with spelling variations

### Troubleshooting

**No articles processed:**

```text
✅ All articles already have embeddings.
```

This is normal - all articles are already indexed.

**API errors:**

```bash
# Add to .env.local
GEMINI_KEY=your_key_here
```

- Check `GEMINI_KEY` is set correctly in `.env`
- Verify API quota hasn't been exceeded
- Ensure network connectivity

**Character encoding issues:**

- The script handles Windows-1252 encoding automatically
- RTF escape sequences are converted to proper characters
- If you see garbled text, check the source RTF format

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (with `pgvector` extension)
- Python 3+ (for migration scripts)

### Web Application

The web client is located in the `web/` directory.

1. **Install dependencies**:

   ```bash
   cd web
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` (if available) or create a `.env` file with your database credentials:

   ```bash
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

### Data Migration

To populate the database from legacy sources:

1. **Extract Data**:
   Use the scripts in `scripts/` to convert MDB files to CSV.

   ```bash
   cd scripts
   ./extract_mdb_data.sh
   ```

2. **Database Migration & Seeding**:
   The project uses Drizzle ORM for schema management and seeding.

   ```bash
   # From web directory
   npm run db:push
   ```

3. **Date Normalization**:
   Historical dates are extracted from article content using a custom PostgreSQL function (see [ADR-005](docs/adr/005-article-date-extraction.md)). This happens automatically during migration.

4. **Generate Embeddings**:
   Process RTF content and generate vector embeddings for semantic search.

   ```bash
   npm run ingest
   ```

## 🤖 AI Provider Setup

The application uses a robust fallback strategy to ensure high availability. It attempts to use providers in the following order:

1. **Groq** (Primary - Fast)
2. **Cerebras** (High Throughput)
3. **Google Gemini** (Reliable Free Tier)
4. **Moonshot AI** (Large Context)
5. **DeepSeek** (Cost Effective)
6. **OpenAI** (Ultimate Reliability)

### Obtaining API Keys

To enable the full fallback chain, configure the following keys in your `.env` or `.env.local` file:

1. **Groq**: Sign up at [console.groq.com](https://console.groq.com)
2. **Cerebras**: Get key from [cloud.cerebras.ai](https://cloud.cerebras.ai)
3. **Google (Gemini)**: Get key from [aistudio.google.com](https://aistudio.google.com)
4. **Moonshot (Kimi)**: Register at [platform.moonshot.cn](https://platform.moonshot.cn) (Requires ~$1 recharge)
5. **DeepSeek**: Sign up at [platform.deepseek.com](https://platform.deepseek.com)
6. **OpenAI**: Get key from [platform.openai.com](https://platform.openai.com)

```env
GROQ_KEY=...
Cerebras_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
MOONSHOT_API_KEY=...
DEEPSEEK_API_KEY=...
OPENAI_API_KEY=...
```
