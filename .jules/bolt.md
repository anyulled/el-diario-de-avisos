## 2024-05-22 - Chat Interface Re-renders
**Learning:** The `ChatInterface` using `useChat` triggers full re-renders on every input change because the message list rendering was inline. This is a common bottleneck with `ai/react` when combined with local input state.
**Action:** Always extract message list items into memoized components when using `useChat` to prevent re-rendering the entire history on every keystroke.

## 2026-01-27 - Missing Vector Index
**Learning:** Found that `essayEmbeddings` table was missing the HNSW index that `articleEmbeddings` had. This caused O(N) performance for essay vector searches.
**Action:** Always check all embedding tables for proper HNSW indexing when using pgvector.
