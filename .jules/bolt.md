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

## 2026-03-09 - getNews Table Scan Optimization
**Learning:** `getNews` was executing a full `count(*)` table scan on the `articles` table even when no search filters were applied, which is extremely expensive on large PostgreSQL tables and can exhaust DB compute quotas.
**Action:** When counting total rows for pagination without active filters, always use `db.execute(sql\`SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = 'table_name'::regclass\`)` to get an estimated row count instead of a full table scan.

## 2026-03-09 - NavbarUI Scroll Re-renders and Grouping
**Learning:** `NavbarUI` tracks `isScrolled` via an event listener on the window. This causes the component to re-render constantly as the user scrolls. During this constant re-rendering, `groupedEssays` was being calculated via a `.reduce()` loop on the `essays` array every single time, eating up CPU and dropping scroll frame rates.
**Action:** Always wrap heavy list calculations (like `.reduce()` grouping) in `useMemo` when inside components that track frequent state updates like scroll position or input values.

## 2026-03-10 - Unnecessary Force-Dynamic

**Learning:** The "Tal día como hoy" page was utilizing `export const dynamic = "force-dynamic";`, bypassing caching and SSG despite the content only changing once per day.
**Action:** Replace `force-dynamic` with Incremental Static Regeneration (ISR) using `export const revalidate = 3600;` on pages where content changes predictably (e.g., daily) to optimize TTFB and reduce unnecessary database queries.
## 2026-03-10 - getArticleCount Table Scan Optimization
**Learning:** `getArticleCount` was executing an exact `count(*)` using Drizzle's `count()`, which caused a full table scan on the large `articulos` table. This led to unnecessary compute quota exhaustion for a static UI metric that only needs an estimate.
**Action:** Replaced exact count with `db.execute(sql\`SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = 'articulos'::regclass\`)` to provide an O(1) estimate, matching the fast-path pattern used in `getNews`.
