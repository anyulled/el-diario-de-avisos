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

## 2026-03-01 - Article Section Caching

**Learning:** \`getArticleSection\` was being queried on every visit to an article detail page (\`/article/[id]\`). The section names change very rarely and are perfect for caching.
**Action:** Wrapped \`getArticleSection\` with \`unstable_cache\`, linking it to the \`news-types\` cache tag so it remains synchronized if the sections table updates.

## 2024-05-30 - [Memoizing highlightText]
**Learning:** In the `ArticleCard` component, `highlightText` was being executed directly on every render, which becomes a bottleneck when processing large numbers of results or during fast re-renders (like user typing in the search bar). This codebase uses a custom `highlightText` function with complex regular expression generation.
**Action:** Use `useMemo` for any string manipulations that rely on regex or loop operations (like `highlightText` or `formatArticleTitle`) within list items or frequently re-rendered components, using `searchTerm` and `title`/`subtitle` as dependencies.

## 2026-03-09 - highlightText HTML Separation Overhead

**Learning:** Separating text and HTML tags using `Array.from(String.prototype.matchAll())` and iterating manually with `slice` is extremely slow. Using `String.prototype.split(/(<[^>]+>)/g)` instead is up to 10x faster because it leverages the highly optimized V8 split engine, which automatically captures tags at odd indices and text at even indices. Adding a fast path `indexOf('<') === -1` skips regex entirely for plain text strings.
**Action:** When parsing strings to isolate or modify text outside of HTML tags, prefer `split(/(<[^>]+>)/g)` with an array map/join over `matchAll` and `reduce`. Always include a plain text fast path.

## 2026-03-31 - Cypress 500 Timeouts on DB Quota Exhaustion

**Learning:** When using Neon DB or other scale-to-zero databases on free tiers, `npm run build` or the initial Next.js compile during Cypress `wait-on` can easily trigger a `503 Compute Quota Exceeded` error or timeout. If `wait-on` points to a heavy route like `/` that performs DB queries, Cypress will fail with a 500 error before tests even start.
**Action:** Always point `wait-on` in CI (`.github/workflows/cypress.yml` or package.json) to a dedicated, static health endpoint like `/api/health` that returns immediately without touching the database.

## 2026-03-31 - Cypress False Negatives due to Environment Limits

**Learning:** Even with a fast `wait-on` endpoint, Cypress tests will fail confusingly if they try to interact with the app while the DB quota is exhausted.
**Action:** Create a dedicated DB health check endpoint (`/api/db-health`) and add a `before` hook in `cypress/support/e2e.ts` to call it. If it returns 503, use `this.skip()` to safely exit the run rather than failing it, preventing false negative CI signals.

## 2026-03-31 - generateMetadata Uncaught DB Errors

**Learning:** Next.js Error Boundaries (`error.tsx`) do NOT catch errors thrown inside `generateMetadata()`. If a transient DB error occurs during static generation (`next build`) within `generateMetadata`, it will crash the entire build process.
**Action:** Always explicitly wrap database queries inside `generateMetadata` with a `try/catch` block and return safe fallback metadata strings to ensure static prerendering succeeds even when the DB is temporarily unavailable. Do NOT use `export const dynamic = "force-dynamic"` globally to fix this, as it destroys SSG performance.
