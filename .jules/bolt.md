## 2024-05-22 - Chat Interface Re-renders
**Learning:** The `ChatInterface` using `useChat` triggers full re-renders on every input change because the message list rendering was inline. This is a common bottleneck with `ai/react` when combined with local input state.
**Action:** Always extract message list items into memoized components when using `useChat` to prevent re-rendering the entire history on every keystroke.

## 2026-01-27 - Missing Vector Index
**Learning:** Found that `essayEmbeddings` table was missing the HNSW index that `articleEmbeddings` had. This caused O(N) performance for essay vector searches.
**Action:** Always check all embedding tables for proper HNSW indexing when using pgvector.

## 2026-01-28 - Over-fetching Large Columns
**Learning:** `getNews` and `getArticlesOnThisDay` were fetching `content` (bytea) and `searchVector` (tsvector) for list views, causing unnecessary DB IO and large network payloads. Next.js serializes all Server Action return values to the client.
**Action:** Explicitly exclude large columns (`content`, `searchVector`) from Drizzle queries or return objects when they are not needed for the UI.

## 2026-01-29 - Single Article Optimization
**Learning:** Individual article lookups (`getArticleById`) were uncached and fetched the heavy `searchVector` column.
**Action:** Wrap single-item lookups in `unstable_cache` and use `getTableColumns` to exclude large, unused columns like `searchVector` to reduce payload size.
