import * as Sentry from "@sentry/nextjs";

console.log("Sentry Client Config Loaded. DSN:", process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: true,
});
