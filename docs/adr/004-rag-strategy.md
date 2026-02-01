# ADR 004: RAG Strategy & Vector Search

## Context

The application aims to provide an "AI Historian" chatbot that can answer questions about the specific contents of the archive. Standard LLMs (like GPT-4 or Llama 3) do not know the specific local history contained in these 19th-century Venezuelan newspapers (Knowledge Cutoff / obscure data).

## Decision

We implemented a **Retrieval-Augmented Generation (RAG)** pipeline using **pgvector**.

### 1. Vector Storage

- **Database**: PostgreSQL with the `vector` extension (`pgvector`).
- **Schema**: `article_embeddings` table stores `768`-dimensional vectors linked to `articulos.id`.
- **Distance Metric**: Cosine distance (via `<=>` operator) used for similarity search.

### 2. Embedding Model

- **Provider**: **Google Generative AI (Gemini)**.
- **Model**: `text-embedding-004`.
- **Reasoning**: strong multilingual support, large context window, and 768 dimensions provide a good balance of performance and storage size.

### 3. Ingestion Pipeline

- **Script**: A custom idempotent script (`scripts/ingest.ts`) scans for articles without embeddings.
- **Batching**: Processes articles in batches (500 per run) to manage API rate limits.
- **Content**: Embeds the combined Title + Cleaned Content (stripped of RTF).

### 4. Retrieval (Chatbot)

- **Flow**:
  1. User query is embedded using the same model.
  2. System retrieves top k similar articles.
  3. (Updated in [ADR-001](adr/001-hybrid-search-and-unaccent.md)) System matches keywords via Hybrid Search.
  4. Retrieved context is injected into the System Prompt.
  5. Llama 3 (via Groq) generates the response using the provided context.

## Consequences

- **Pros**:
  - **Accuracy**: Chatbot answers are grounded in actual archive data, reducing hallucinations.
  - **Stack Simplicity**: Using `pgvector` avoids needing a separate vector DB (Pinecone, Weaviate), keeping operational complexity low.
- **Cons**:
  - **Latency**: Generating embeddings for the query adds a small latency overhead.
  - **Cost**: API costs for embedding generation (though currently using free tiers/low cost).

## Status

Accepted.
