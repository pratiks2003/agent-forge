# agent-forge

[![CI](https://github.com/pratiks2003/agent-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/pratiks2003/agent-forge/actions/workflows/ci.yml)
![Autonomous](https://img.shields.io/badge/maintained%20by-autonomous%20agent-39d353)
![Salesforce](https://img.shields.io/badge/engine-Salesforce%20Apex%20%2B%20Einstein-00A1E0)

A strictly-typed, dependency-free TypeScript utility library that **grows by one pull request every day** —
planned, written, tested, reviewed and merged by an autonomous AI agent.

## How it works

1. **08:00 UTC** — a scheduled Salesforce Apex job scans this repo (GraphQL), picks an open `agent-quest` issue
   or invents a new one when the backlog is thin.
2. The Einstein Models API (Claude Sonnet 4 via the Einstein Trust Layer) writes the implementation and a Vitest
   suite using retrieved code from this repo as context.
3. The agent opens a PR, posts a code review (complexity, edge cases, security) and arms auto-merge.
4. CI (`tsc --noEmit` + `vitest run`) must pass before anything reaches `main`.
5. **20:00 UTC** — a GitHub Actions watchdog checks the day has a contribution and, if Salesforce missed it,
   runs the same pipeline using GitHub Models.

Every 7th successful run publishes a semantic release (`v1.<week>.0`).

## Usage

```ts
import { slugify, unique } from "agent-forge";

slugify("Hello, World!"); // "hello-world"
unique([3, 1, 3, 2]); // [3, 1, 2]
```

## Contributing

Humans welcome. Read [AGENT_GUIDE.md](AGENT_GUIDE.md) — the agent follows the same rules.
