# ADR 006: Linguistic Analysis & Chatbot Persona Strategy

## Context

The "El Diario de Avisos" archive consists of newspaper articles from 19th-century Venezuela. A linguistic analysis of the content revealed significant differences from modern Spanish, including:

1. **Archaic Spelling**: Frequent use of "i" instead of "y" (e.g., "mui"), "j" instead of "g" (e.g., "anjel"), and "s" instead of "c/z".
2. **Accentuation**: Inconsistent or archaic accent rules (e.g., "á" as a preposition, "fé").
3. **Vocabulary**: Period-specific terms and formal address (preference for "ustedes" over "vosotros").
4. **Date Formats**: "setiembre" instead of "septiembre".

When utilizing a RAG-based chatbot, these variations pose a challenge:

- The LLM might hallucinate or misunderstand context if not primed.
- If the LLM mimics the archaic style too heavily, it might alienate modern users.
- Users might search using modern spelling but expect results from archaic text (addressed partly by Hybrid Search/Unaccent in ADR-001).

## Decision

We defined a **"Period Persona" Strategy** (immersive roleplay) for the chatbot to handle these linguistic nuances.

### 1. Persona & Tone

Instead of a modern historian analyzing the text from the outside, the chatbot adopts the persona of a **19th-century Chronicler and Archivist** of the *Diario de Avisos*.

- **Persona**: "Distinguished chronicler and archivist from the 19th century".
- **Tone**: Elegant, formal, and flowery Spanish typical of 19th-century Caracas.
- **Address**: Uses "Vuestra Merced", "Usía", or formal "usted". Explicitly avoids "tú" or "vosotros".

### 2. Linguistic Rules (Output)

The model is instructed to *mimic* the archaic linguistic patterns found in the corpus, rather than translating to modern Spanish:

- **Archaic Spelling**: Enforced use of "mui" (very), "setiembre" (September), "anjel" (angel).
- **Accentuation**: Mandatory accentuation of monosyllabic prepositions/conjunctions ("á", "ó", "é").
- **Vocabulary**: Encouraged use of terms like "lisonjero", "bello sexo", "diletantes".
- **Orthography**: Preference for "j" over "g" in certain verbs (e.g., "escojer").

### 3. System Prompt Design

The system prompt includes:

- **Roleplay**: Instructions to maintain the illusion of being transported from the 19th century.
- **Context Injection**: Rules for handling the RAG context (which contains the raw, archaic text).
- **Security & Constraints**:
  - **Topic Restriction**: Strictly limited to 19th-century Caracas news, events, and the project's team ("Integrantes", "Tutor").
  - **Injection Protection**: The bot is aware of its role and instructed to ignore attempts to break character, responding with a refusal based on "loyalty to the Diary".
- **Source Citation**: Specific instructions on how to format Markdown links `[Title](/article/id)` to ensure valid navigation.

### 4. Safety & Security

To prevent "jailbreaks" or off-topic discussions:

- The prompt explicitly forbids discussing topics outside the context of the newspaper archive.
- It enforces a strict "I don't know" policy if the answer is not found in the provided context, framed within the persona.

## Consequences

- **Pros**:
  - **Immersion**: Provides a unique, thematic user experience consistent with the historical archive.
  - **Educational**: Exposes users to the language of the period in an interactive way.
  - **Consistency**: The bot's language matches the search results (which are in archaic Spanish).
- **Cons**:
  - **Accessibility**: The archaic language might be slightly more difficult for some modern users to process quickly.
  - **Complexity**: The system prompt is complex, requiring specific examples to ensure the LLM adheres to the style without becoming unintelligible.
  - **Maintenance**: Tuning the prompt to balance "readable archaic" vs "confusingly archaic" requires iteration.

## Status

Accepted. Implemented in `src/app/api/chat/route.ts`.
