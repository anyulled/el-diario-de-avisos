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

## 2026-02-05 - Article List Optimization

**Learning:** Found that `getArticlesOnThisDay` was fetching the large `searchVector` column even though it wasn't used, and passing it to the client (serialized by Next.js).
**Action:** Use `getTableColumns` with destructuring to explicitly exclude `searchVector` from Drizzle queries when it's not needed, reducing payload size.

## 2026-02-05 - TypeScript Mismatch on Optimization

**Learning:** When excluding columns from a Drizzle query using and destructuring, TypeScript types derived from in consuming components must be updated to explicitly the excluded columns, otherwise or will fail with type mismatches.
**Action:** Whenever changing the shape of data returned by a server action, immediately grep for usages of that action and update the Prop types of any components receiving that data.

## 2026-02-05 - TypeScript Mismatch on Optimization

**Learning:** When excluding columns from a Drizzle query using `getTableColumns` and destructuring, TypeScript types derived from `$inferSelect` in consuming components must be updated to explicitly `Omit` the excluded columns, otherwise `tsc` or `next build` will fail with type mismatches.
**Action:** Whenever changing the shape of data returned by a server action, immediately grep for usages of that action and update the Prop types of any components receiving that data.

## 2026-02-05 - PlainText Over-fetching

**Learning:** `getNews` was selecting `plainText` (large text field) by default, and `getArticlesOnThisDay` was returning it to the client, even though it wasn't used in list views. This increased payload size significantly.
**Action:** Explicitly exclude `plainText` from Drizzle queries and Server Action return values when not needed. Update component props types to `Omit` it.

## 2026-02-03 - Single Article PlainText Over-fetching

**Learning:** `getArticleById` was fetching `plainText` (large text field) via `getCachedArticle`. This column is not used in the article detail page (which parses `content` RTF) or metadata generation.
**Action:** Explicitly exclude `plainText` from `getTableColumns` destructuring in `getCachedArticle` to optimize data transfer for single article lookups.

## 2026-02-05 - Optimized Text Substring Fetch

**Learning:** `getArticlesOnThisDay` was fetching the full `plainText` column (potentially large) only to slice 500 characters in Node.js.
**Action:** Use `sql<string>\`substring(${table.column} from 1 for 500)\`` in Drizzle queries to fetch only the needed text snippet directly from the database, reducing network transfer and memory usage.

## 2026-02-05 - Essay Caching

**Learning:** Cached `getEssayById` using `unstable_cache`. Since `essay.content` is a `Buffer` (bytea), it must be manually converted to Base64 before caching and back to Buffer after retrieval, as `unstable_cache` serializes to JSON inefficiently for Buffers.
**Action:** Always handle Buffer serialization manually when using `unstable_cache` with Drizzle `bytea` columns.

## 2026-02-05 - Conditional Content Fetch

**Learning:** `getArticlesOnThisDay` was fetching the large `content` (bytea) column even when `plainText` was available, wasting bandwidth.
**Action:** Use conditional SQL fetch `sql<Buffer | null>\`CASE WHEN ${table.plainText} IS NULL THEN ${table.content} ELSE NULL END\`` to avoid transferring large blobs when a lighter alternative exists.
