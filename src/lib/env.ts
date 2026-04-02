import { createEnv } from "@t3-oss/env-nextjs";

// Validates environment variables at build time and provides a type-safe `env` object.
//
// To add a new env var:
// 1. Add the schema to `server` (private) or `client` (NEXT_PUBLIC_ prefixed).
//    Example: DATABASE_URL: z.string().url()
// 2. Add the variable to `.env.example`.
// 3. For client vars, also add them to `experimental__runtimeEnv`.

export const env = createEnv({
  server: {},
  client: {},
  experimental__runtimeEnv: process.env,
});
