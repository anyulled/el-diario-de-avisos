# 7. Use Vercel AI SDK over OpenAI SDK

Date: 2026-02-11

## Status

Accepted

## Context

The "El Diario de Avisos" chatbot requires a robust and resilient AI architecture. Specifically, we face the following challenges:

1. **Rate Limits**: The primary provider (Groq) has strict rate limits on its free/developer tiers, necessitating a fallback mechanism.
2. **Multi-Provider Support**: We need to integrate diverse providers (Groq, Cerebras, Google Gemini, Moonshot AI, DeepSeek, OpenAI) to ensure high availability and cost optimization.
3. **Streaming**: The user experience demands real-time streaming of responses.
4. **Standardization**: Managing separate SDKs (OpenAI, Google, Anthropic, etc.) with different response formats and error handling would lead to significant code complexity and maintenance burden.

The alternative would be to use the official OpenAI Node.js SDK, which many other providers (Groq, DeepSeek, Moonshot) mimic. However, some providers (Google Gemini) have distinct APIs, and manual stream handling across different protocols is error-prone.

## Decision

We have decided to use the **Vercel AI SDK (`ai` package)** as the unified abstraction layer for all AI interactions, rather than using the OpenAI SDK directly or implementing custom fetch wrappers.

## Consequences

### Benefits

- **Unified Interface**: The SDK provides a single, consistent API (`streamText`, `generateText`) for all providers. This allows us to switch between Groq, Cerebras, and Google Gemini by simply changing the model object passed to `streamText`, without rewriting the request/response logic.
- **Provider Abstraction**: The `AIProviderManager` we implemented can easily return a standardized model object that the core chat logic consumes without knowing the underlying provider details.
- **First-Class Streaming**: The SDK handles the complexities of streaming (Server-Sent Events) and provides helpers like `toUIMessageStreamResponse`, simplifying the integration with the frontend `useChat` hook.
- **Ecosystem Compatibility**: Vercel AI SDK has official or community-maintained providers for almost every major AI service (Groq, Google, Mistral, OpenAI, etc.), making it easy to expand our fallback chain.
- **Middleware & Hooks**: The SDK architecture makes it easier to inject middleware for logging, rate limiting, and error handling (as seen in our `AIProviderManager` implementation).

### Trade-offs

- **Vendor Lock-in (Soft)**: While open source, the SDK is a Vercel product. However, its widespread adoption and compatibility with standard web APIs mitigate this risk.
- **Abstraction Leaks**: In very advanced use cases, specific provider features (like caching headers or specific hyper-parameters) might require "escape hatches" or raw API access, though the SDK usually exposes these via provider-specific config options.
- **Bundle Size**: Adding the SDK adds a small amount of overhead compared to a raw `fetch` implementation, but the productivity gains outweigh this negligible cost for a Node.js runtime.

## Compliance

- The project successfully integrates Groq, Cerebras, Google, and potentially others using a single `route.ts` implementation.
- The `AIProviderManager` relies on the common interface enforced by the SDK.
- Tests in `src/app/api/chat/route.test.ts` verify that swapping providers does not break the application logic.
