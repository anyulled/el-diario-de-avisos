# ADR 003: Legacy Data Encoding (Windows-1252) & RTF

## Context

The source data comes from legacy Microsoft Access (MDB) files and SQL dumps from the late 90s/early 2000s.

1. **Encoding**: The text data is primarily stored as raw bytes using **Windows-1252** encoding (common in legacy Windows systems). However, newer manual updates or specific imports may be in **UTF-8**.
2. **Format**: The `arti_contenido` field contains **Rich Text Format (RTF)** data, including control words (`\rtf1`, `\ansi`) and hex-encoded characters (`\'e1` for 'á').

This raw format presents challenges for:

- **Search**: We cannot index raw RTF markup (e.g., searching for "musica" won't match `m\'fasica`).
- **Display**: Modern browsers do not render RTF.
- **AI Processing**: LLMs require clean text.

## Decision

We decided to handle decoding and cleaning primarily within **PostgreSQL** for search indexing, and use **Node.js utilities** for AI ingestion.

### 1. Database-Side Processing (Search)

We created a PL/pgSQL function `strip_rtf_content(bytea)` that:

- **Decodes**: Converts `bytea` from `WIN1252` to internal PostgreSQL text (`convert_from(..., 'WIN1252')`).
- **Sanitizes**: Uses Regex to strip RTF control codes (`\rtf`, `\fonttbl`) and convert hex sequences (`\'xx`) to their character equivalents.
- **Usage**: This function is called by the search vector trigger (ADR-002) to ensure the index contains only clean text.

### 2. Application-Side Processing (Display & AI)

For the web UI and Vector Ingestion:

- **Hybrid Encoding Detection**: We implemented a smart detection strategy (`processRtfContent`). We first attempt to decode as UTF-8. If the result contains invalid replacement characters (`\uFFFD`), we fallback to **Windows-1252**. This ensures both legacy articles and modern edits render correctly.
- **RTF Conversion**: We use libraries like `@iarna/rtf-to-html` (with modifications/wrappers) or custom regex parsing in TypeScript to display content.
- **Clean Text**: For RAG, we strictly clean the content to pure text to save token usage and improve semantic clarity.

## Consequences

- **Pros**:
  - **Data Preservation**: The "Source of Truth" in the DB remains the original raw `bytea`. We do not destructively modify the legacy artifacts.
  - **Searchability**: The index is clean, enabling effective full-text search.
- **Cons**:
  - **Complexity**: Regex parsing of RTF is fragile and computationally expensive compared to storing plain text.
  - **Maintainability**: The custom PL/pgSQL function needed updates to handle edge cases (like split hex codes in [ADR-001](001-hybrid-search-and-unaccent.md)).

## Status

Accepted.
