# El Diario de Avisos

**El Diario de Avisos** is a comprehensive digital archive and semantic search platform designed to preserve and make accessible historical publications, essays, and articles. The project modernizes a legacy database system into a performant, vector-enabled web application.

## 📂 Project Structure

- **`web/`**: The modern Next.js web application. Handles the UI, database queries via Drizzle ORM, and AI/Vector search logic.
- **`scripts/`**: Utilities for extracting and transforming data from legacy MDB (Microsoft Access) files into a format suitable for PostgreSQL.
- **`data/`**: Intermediate storage for extracted CSVs and SQL dumps.
- **`music/`**: Assets for the application's audio playback features.

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
        RelationalData[Relational Data\n(Articles, Authors)]
        VectorData[Vector Embeddings\n(768 dims)]
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

2. **Process Dates**:
   Normalize historical date formats.

   ```bash
   python3 extract_dates.py
   ```

3. **Seed Database**:
   Use Drizzle or the SQL scripts to load data.

   ```bash
   # From web directory
   npm run db:push
   ```

4. **Generate Embeddings**:
   Process RTF content and generate vector embeddings for semantic search.

   ```bash
   # From web directory
   npm run ingest
   ```
