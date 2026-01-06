# ADR 001: Hybrid Search & Unaccent Extension

## Context

The application relies on searching historical newspaper archives. Users expect to find articles regardless of:

1. **Accents**: "Necrología" should match "necrologia".
2. **Variants**: "José ánjel Montero", "jose anjel montero".
3. **Typos**: Minor spelling errors.
4. **Semantic meaning**: "Obituario" finding "Necrología".

Initially, the application used:

- **Full-Text Search (tsvector)**: Good for exact words but strict on accents.
- **Vector Search (Embeddings)**: Good for meaning but can miss exact names/titles if semantic distance is far.

**Problem**: The chatbot failed to find specific articles (e.g., "Necrología") when users searched without accents or with specific name variants, because vector search didn't prioritize the exact matches highly enough, and the keyword search was accent-sensitive.

## Decision

We implemented a **Hybrid Search** strategy combined with PostgreSQL's **unaccent** extension.

### 1. Unaccented Keyword Search

- **Extension**: Enabled `unaccent` in PostgreSQL.
- **Configuration**: Created a custom `spanish_unaccent` text search configuration.
- **Implementation**:
  - `to_tsvector` uses `spanish_unaccent`.
  - `websearch_to_tsquery` uses `spanish_unaccent` (handling multi-word inputs like "jose anjel").

### 2. Hybrid Search (Chatbot)

The chatbot retrieval logic now combines two sources:

1. **Vector Search**: Retrieves 5 results based on semantic similarity.
2. **Keyword Search**: Retrieves 10 results based on `ts_rank` using `spanish_unaccent`.

**Merging Strategy**:

- Results are deduplicated by ID.
- Keyword matches are assigned a synthetic high similarity score (0.95) to ensure they appear in the top context.
- The final context list is sorted by similarity descending.

## Consequences

- **Pros**:
  - Robust against accent differences ("necrologia" == "Necrología").
  - Handles exact name lookups reliably even if semantic embeddings differ slightly.
  - Preserves semantic search capabilities for abstract queries.
- **Cons**:
  - Requires `unaccent` extension in Postgres (added to migration).
  - Slightly more complex retrieval logic (two DB queries instead of one).
  - Synthetic scoring (0.95) is a heuristic that may need tuning if real vector matches are extremely high confidence.

## Status

Accepted and Implemented.
