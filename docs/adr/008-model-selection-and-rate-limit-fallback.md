# 008: Model Selection and Rate Limit Fallback

## Status

Accepted

## Context

The application relies on multiple AI providers (Groq, Cerebras, Google, Moonshot, DeepSeek, OpenAI) to provide conversational capabilities. Some providers, particularly high-speed ones like Groq and Cerebras, have strict rate limits that can result in `429 Too Many Requests` status responses during peak usage or high-frequency interactions.

To ensure high availability and a seamless user experience, the application needs a robust mechanism to:

1. Detect rate limit errors immediately.
2. Fall back to alternative models or providers without user intervention.
3. Handle streaming responses correctly even when an error occurs shortly after the stream starts.

## Decision

We have implemented a registry-based model selection and fallback mechanism. The key components of this decision are:

### 1. Centralized Provider Registry

An `AIProviderRegistry` manages the available AI providers and defines a default `fallbackChain`. This chain specifies the preferred order of models to use.

### 2. Recursive Fallback Logic

The `executeWithFallback` function in the chat request runner implements a recursive strategy. If a model fails, it automatically tries the next one in the fallback chain.

### 3. Early Error Detection in Streams

The Vercel AI SDK's `streamText` might receive a `200 OK` status but then emit an error chunk (e.g., if a rate limit is hit during generation). To handle this, we implemented `validateAndReturnStream`, which:

- Buffers the initial chunks of the stream.
- Inspects them for error markers.
- Throws an error if an issue is detected, allowing the fallback logic to engage before the client starts processing the stream.

### 4. Bypassing Internal Retries

We set `maxRetries: 0` in the `streamText` configuration. This allows our custom fallback logic to take over immediately upon the first failure, which is more efficient for switching providers than retrying the same (potentially still rate-limited) provider multiple times.

### 5. Categorized Error Handling

The mechanism distinguishes between transient errors (like 429s or 500s), which trigger a fallback, and client errors (4xx other than 429), which are thrown back to the caller to avoid redundant failures across providers.

## Consequences

### Positive

- **High Availability**: The system remains functional even if one or more AI providers are down or rate-limited.
- **Improved UX**: Users do not see raw error messages from providers; instead, they experience a slight latency as the system switches to a backup model.
- **Flexibility**: The fallback order can be easily adjusted in the `AIProviderRegistry`.

### Negative

- **Buffering Overhead**: `validateAndReturnStream` introduces a small initial latency as it buffers the first few chunks to verify the stream's health.
- **Cost Management**: Falling back to a more expensive provider (e.g., OpenAI) might increase operational costs if cheaper providers are frequently rate-limited.

## References

- [chat-request-runner.ts](../../src/app/api/chat/chat-request-runner.ts)
- [ai-provider-registry.ts](../../src/lib/ai-provider-registry.ts)
- [route.ts](../../src/app/api/chat/route.ts)
