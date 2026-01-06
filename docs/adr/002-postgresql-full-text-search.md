# ADR 002: PostgreSQL Full-Text Search

## Context

The application contains a large archive of historical articles (~10k+) with significant text content. Users need to search this content efficiently. The requirements include:

- Sub-second search response times.
- Spanish language support (stemming, stop words).
- Ranking by relevance (title vs. content).
- Minimal infrastructure complexity (avoiding separate search services like Elasticsearch or Algolia if possible).

## Decision

We decided to use **PostgreSQL's Native Full-Text Search**.

### Implementation Details

1. **Data Structure**: Added a `search_vector` column of type `tsvector` to the `articulos` table.
2. **Indexing**: Used a **GIN (Generalized Inverted Index)** on the `search_vector` column for high performance.
3. **Trigger-Based Updates**: Implemented a PL/pgSQL trigger `articulos_search_vector_update` that automatically updates the index whenever an article is inserted or modified.
4. **Spanish Configuration**: Utilized the standard `spanish` dictionary (later augmented to `spanish_unaccent` in ADR-001) for stemming.

## Consequences

- **Pros**:
  - **Simplicity**: No external infrastructure to manage/pay for. Data and index live in the same place.
  - **Consistency**: Updates are transactional. The index never drifts from the data.
  - **Performance**: GIN indexes provided excellent speed for the current dataset size.
- **Cons**:
  - **Ranking Limitations**: Less tuning flexibility compared to dedicated search engines (e.g. custom BM25 tuning is harder).
  - **Compute Load**: Search load hits the primary database CPU.
  - **Scaling**: Might require partitioning or read replicas if dataset grows into millions of rows (currently not a concern).

## Status

Accepted.
