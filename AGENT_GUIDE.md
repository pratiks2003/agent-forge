# Agent Guide

Rules the autonomous agent (and humans) follow in this repository.

## Scope of a change
- One implementation file under `src/<area>/<name>.ts` and one test file under `tests/<name>.test.ts`.
- Never edit `.github/`, `package.json`, `tsconfig.json` or lock files.
- No runtime dependencies. Node built-ins only when unavoidable.

## Code style
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`). No `any`.
- Named exports only, one primary export per file.
- Imports use relative paths without extensions, e.g. `import { unique } from "../src/arrays/unique";`.
- Every exported function has JSDoc with `@example`, `@param`, `@returns` and its Big-O complexity.
- Pure functions; never mutate inputs.
- Throw `RangeError`/`TypeError` with clear messages on invalid arguments.

## Tests
- Vitest: `import { describe, expect, it } from "vitest";`
- Cover the happy path, edge cases (empty, single, large, invalid input) and immutability.

## Areas
`strings`, `arrays`, `objects`, `math`, `dates`, `async`, `validation`, `structures` (data structures), `algorithms`.
