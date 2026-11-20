#!/usr/bin/env node
/**
 * 2-year watchdog failover.
 *
 * Runs daily at 20:00 UTC. If the owner already has a contribution today (UTC), it exits.
 * Otherwise it executes a backup quest end-to-end, mirroring the Salesforce pipeline:
 *   pick/generate quest -> RAG context -> LLM code + tests -> branch -> 2 commits -> PR
 *   -> code review -> auto-merge (CI-gated) -> profile README refresh.
 *
 * GitHub writes use AGENT_PAT (so contributions are attributed to the owner — work done
 * with GITHUB_TOKEN is credited to github-actions[bot] and would NOT turn the graph green).
 * LLM calls use GitHub Models with the workflow's GITHUB_TOKEN (permissions: models: read).
 */
import { appendFileSync } from "node:fs";

const {
  AGENT_PAT,
  GITHUB_TOKEN,
  OWNER,
  REPO,
  PROFILE_REPO = OWNER,
  DASHBOARD_URL = "",
  MODEL = "openai/gpt-4.1",
  FORCE = "false",
  GITHUB_STEP_SUMMARY
} = process.env;

const API = "https://api.github.com";
const MODELS_URL = "https://models.github.ai/inference/chat/completions";
const QUEST_TYPES = ["Feature", "Unit_Test", "Refactor", "Docs", "Challenge"];
const README_START = "<!-- AGENT:START -->";
const README_END = "<!-- AGENT:END -->";
let tokenExpiry = null;
const log = [];

function note(line) {
  const stamped = `[${new Date().toISOString().substring(11, 19)}Z] ${line}`;
  log.push(stamped);
  console.log(stamped);
}

// ---------------------------------------------------------------- GitHub helpers

async function gh(method, path, body, { allow = [] } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${AGENT_PAT}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "autonomous-dev-agent-watchdog",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  tokenExpiry ??= res.headers.get("github-authentication-token-expiration");
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok && !allow.includes(res.status)) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text.substring(0, 400)}`);
  }
  return { status: res.status, ok: res.ok, data };
}

async function graphql(query, variables) {
  const { data } = await gh("POST", "/graphql", { query, variables });
  if (data.errors) throw new Error(`GraphQL: ${JSON.stringify(data.errors).substring(0, 400)}`);
  return data.data;
}

// ---------------------------------------------------------------- LLM (GitHub Models)

async function llmJson(system, user, keys) {
  const prompt = `${user}\n\nRespond with ONLY a JSON object containing exactly these string keys: ${keys.join(", ")}.`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(MODELS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error(`GitHub Models ${res.status}: ${(await res.text()).substring(0, 400)}`);
    const body = await res.json();
    const text = body.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
      for (const k of keys) {
        if (parsed[k] === undefined || parsed[k] === null) throw new Error(`missing ${k}`);
        parsed[k] = String(parsed[k]);
      }
      return parsed;
    } catch (e) {
      note(`LLM attempt ${attempt} returned unusable JSON (${e.message})`);
    }
  }
  throw new Error("LLM returned unusable JSON twice");
}

// ---------------------------------------------------------------- steps

async function contributionsToday() {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const data = await graphql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){
      totalCommitContributions totalIssueContributions totalPullRequestContributions totalPullRequestReviewContributions restrictedContributionsCount } } }`,
    { login: OWNER, from: from.toISOString(), to: new Date().toISOString() }
  );
  const c = data.user.contributionsCollection;
  return (
    c.totalCommitContributions +
    c.totalIssueContributions +
    c.totalPullRequestContributions +
    c.totalPullRequestReviewContributions +
    c.restrictedContributionsCount
  );
}

async function warnIfTokenExpiring() {
  if (!tokenExpiry) return;
  const days = (new Date(tokenExpiry.replace(" UTC", "Z").replace(" ", "T")) - Date.now()) / 86400000;
  if (Number.isNaN(days) || days > 14) return;
  const title = "⚠️ AGENT_PAT expires soon — renew to keep the streak alive";
  const { data } = await gh("GET", `/repos/${OWNER}/${REPO}/issues?state=open&labels=agent-ops`);
  if (data.some((i) => i.title === title)) return;
  await gh("POST", `/repos/${OWNER}/${REPO}/issues`, {
    title,
    labels: ["agent-ops"],
    body: `The fine-grained token used by the agent expires on **${tokenExpiry}** (~${Math.max(0, Math.floor(days))} days).\n\n` +
      "Renew it, then update: (1) the `AGENT_PAT` repository secret here, and (2) the Salesforce `GitHub` External Credential principal."
  });
  note(`Opened PAT-expiry reminder (expires ${tokenExpiry}).`);
}

async function repoContext() {
  const { data: repo } = await gh("GET", `/repos/${OWNER}/${REPO}`);
  const branch = repo.default_branch;
  const { data: ref } = await gh("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${branch}`);
  const sha = ref.object.sha;
  const { data: tree } = await gh("GET", `/repos/${OWNER}/${REPO}/git/trees/${sha}?recursive=1`);
  const files = tree.tree.filter((t) => t.type === "blob").map((t) => t.path);
  const guide = await readFile("AGENT_GUIDE.md", branch);
  const readme = await readFile("README.md", branch);
  const { data: issues } = await gh("GET", `/repos/${OWNER}/${REPO}/issues?state=open&labels=agent-quest&per_page=50&sort=created&direction=asc`);
  const { data: pulls } = await gh("GET", `/repos/${OWNER}/${REPO}/pulls?state=open&per_page=50`);
  const busy = new Set(pulls.map((p) => p.head.ref));
  const open = issues.filter((i) => !i.pull_request && !busy.has(`agent/quest-${i.number}`));
  return { branch, sha, files, guide, readme, open, allOpen: issues.filter((i) => !i.pull_request) };
}

async function readFile(path, ref) {
  const r = await gh("GET", `/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`, null, { allow: [404] });
  return r.ok ? Buffer.from(r.data.content, "base64").toString("utf8") : "";
}

async function generateQuest(ctx) {
  note("No actionable quest — generating one.");
  const q = await llmJson(
    "You plan work for an autonomous engineer maintaining a strict TypeScript utility library. Invent ONE small, useful quest " +
      "doable as one file under src/ plus one Vitest file under tests/. Never duplicate existing files or open issues. " +
      "The body is GitHub markdown with sections Context, Task, Acceptance Criteria (checkboxes), Edge Cases.",
    `Agent guide:\n${ctx.guide.substring(0, 2500)}\n\nFiles:\n${ctx.files.join("\n")}\n\nOpen issues:\n${ctx.allOpen.map((i) => `#${i.number} ${i.title}`).join("\n") || "(none)"}\n\n` +
      `questType must be one of ${QUEST_TYPES.join(", ")}; ragTags are comma-separated keywords.`,
    ["title", "body", "questType", "ragTags"]
  );
  const type = QUEST_TYPES.includes(q.questType) ? q.questType : "Feature";
  const { data: issue } = await gh("POST", `/repos/${OWNER}/${REPO}/issues`, {
    title: q.title.substring(0, 240),
    body: `${q.body}\n\n---\n<sub>🛟 Self-generated by the GitHub Actions watchdog · type: \`${type}\` · rag: \`${q.ragTags}\`</sub>`,
    labels: ["agent-quest", `type:${type.toLowerCase()}`]
  });
  note(`Created quest issue #${issue.number}: ${issue.title}`);
  return { ...issue, ragTags: q.ragTags };
}

function selectFiles(issue, files) {
  const tokens = `${issue.title} ${issue.ragTags || ""}`.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  const scored = files
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ f, s: tokens.reduce((a, t) => a + (f.toLowerCase().includes(t) ? 3 : 0), 0) + (f.startsWith("src/") ? 1 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.f);
  const test = files.find((f) => f.startsWith("tests/"));
  if (test && !scored.includes(test)) scored.push(test);
  if (files.includes("src/index.ts") && !scored.includes("src/index.ts")) scored.push("src/index.ts");
  return scored;
}

function assertSafe(path, prefix) {
  if (!path.startsWith(prefix) || path.includes("..") || !/^[A-Za-z0-9_./-]+$/.test(path)) {
    throw new Error(`Unsafe path rejected: ${path}`);
  }
}

async function putFile(branch, path, content, message) {
  const existing = await gh("GET", `/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(branch)}`, null, { allow: [404] });
  const { data } = await gh("PUT", `/repos/${OWNER}/${REPO}/contents/${path}`, {
    message,
    branch,
    content: Buffer.from(content, "utf8").toString("base64"),
    ...(existing.ok ? { sha: existing.data.sha } : {})
  });
  return data.commit.sha;
}

async function ensureIndexExport(branch, filePath) {
  if (!filePath.startsWith("src/") || filePath === "src/index.ts") return null;
  const cur = await gh("GET", `/repos/${OWNER}/${REPO}/contents/src/index.ts?ref=${encodeURIComponent(branch)}`, null, { allow: [404] });
  if (!cur.ok) return null;
  const text = Buffer.from(cur.data.content, "base64").toString("utf8");
  const mod = `./${filePath.replace(/^src\//, "").replace(/\.ts$/, "")}`;
  if (text.includes(`"${mod}"`) || text.includes(`'${mod}'`)) return null;
  const next = `${text.endsWith("\n") ? text : `${text}\n`}export * from "${mod}";\n`;
  const { data } = await gh("PUT", `/repos/${OWNER}/${REPO}/contents/src/index.ts`, {
    message: `chore: export ${mod} from the public API`,
    branch,
    sha: cur.data.sha,
    content: Buffer.from(next, "utf8").toString("base64")
  });
  return data.commit.sha;
}

async function refreshProfile(prTitle, prUrl) {
  const path = `/repos/${OWNER}/${PROFILE_REPO}/contents/README.md`;
  const cur = await gh("GET", path, null, { allow: [404] });
  const existing = cur.ok ? Buffer.from(cur.data.content, "base64").toString("utf8") : `# Hi, I'm ${OWNER} 👋\n`;
  const { data: rel } = await gh("GET", `/repos/${OWNER}/${REPO}/releases/latest`, null, { allow: [404] });
  const block =
    `${README_START}\n### 🤖 Autonomous Dev Agent — live status\n\n` +
    "| 🔥 Streak | 🚢 Latest shipped PR | 🏷️ Release | 📡 Live dashboard |\n|---|---|---|---|\n" +
    `| **kept alive by watchdog** | [${prTitle.replace(/\|/g, "/")}](${prUrl}) | \`${rel?.tag_name || "pre-release"}\` | ${DASHBOARD_URL ? `[Agent Command Center](${DASHBOARD_URL})` : "—"} |\n\n` +
    `<sub>Updated ${new Date().toISOString().substring(0, 16).replace("T", " ")} UTC by the GitHub Actions watchdog failover.</sub>\n${README_END}`;
  const s = existing.indexOf(README_START);
  const e = existing.indexOf(README_END);
  const next = s >= 0 && e > s ? existing.substring(0, s) + block + existing.substring(e + README_END.length) : `${existing.trim()}\n\n${block}\n`;
  await gh("PUT", path, {
    message: "chore(profile): watchdog refresh",
    content: Buffer.from(next, "utf8").toString("base64"),
    ...(cur.ok ? { sha: cur.data.sha } : {})
  });
}

// ---------------------------------------------------------------- main

async function main() {
  if (!AGENT_PAT) throw new Error("AGENT_PAT secret is not configured.");
  const today = await contributionsToday();
  await warnIfTokenExpiring();
  note(`Contributions today (UTC): ${today}`);
  if (today > 0 && FORCE !== "true") {
    note("Streak is safe — Salesforce already shipped today. Nothing to do. ✅");
    return;
  }

  const ctx = await repoContext();
  const issue = ctx.open[0] ?? (await generateQuest(ctx));
  note(`Backup quest: #${issue.number} ${issue.title}`);

  const retrieved = [];
  for (const path of selectFiles(issue, ctx.files)) {
    retrieved.push(`### ${path}\n\`\`\`ts\n${(await readFile(path, ctx.branch)).substring(0, 10000)}\n\`\`\``);
  }
  const gen = await llmJson(
    "You are a senior TypeScript engineer. Implement the issue as ONE file under src/ and ONE Vitest file under tests/, " +
      "matching the retrieved code's conventions exactly. The test must import from the implementation file directly (e.g. ../src/math/clamp), never from ../src/index. Must pass `tsc --noEmit` (strict, noUncheckedIndexedAccess) and `vitest run`. " +
      "Implementation < 150 lines, tests < 120 lines, no dependencies. commitMessage is a Conventional Commit. prBody has Summary/Changes/Testing. " +
      "codeReviewCritique is an honest review of the diff covering Complexity, Edge cases, Security, Follow-ups.",
    `## Issue #${issue.number}: ${issue.title}\n\n${(issue.body || "").substring(0, 6000)}\n\n## Guide\n${ctx.guide.substring(0, 3000)}\n\n` +
      `## Files\n${ctx.files.join("\n")}\n\n## Retrieved code\n${retrieved.join("\n\n")}`,
    ["filePath", "fileContent", "unitTestPath", "unitTestContent", "commitMessage", "prTitle", "prBody", "codeReviewCritique"]
  );
  assertSafe(gen.filePath, "src/");
  assertSafe(gen.unitTestPath, "tests/");

  const branch = `agent/quest-${issue.number}`;
  await gh("POST", `/repos/${OWNER}/${REPO}/git/refs`, { ref: `refs/heads/${branch}`, sha: ctx.sha }, { allow: [422] });
  await putFile(branch, gen.filePath, gen.fileContent, gen.commitMessage);
  let headSha = await putFile(branch, gen.unitTestPath, gen.unitTestContent, `test: cover ${gen.filePath} (#${issue.number})`);
  headSha = (await ensureIndexExport(branch, gen.filePath)) ?? headSha;
  note(`Committed ${gen.filePath} + ${gen.unitTestPath} to ${branch}`);

  const existing = await gh("GET", `/repos/${OWNER}/${REPO}/pulls?state=open&head=${encodeURIComponent(`${OWNER}:${branch}`)}`);
  const pr =
    existing.data[0] ??
    (
      await gh("POST", `/repos/${OWNER}/${REPO}/pulls`, {
        title: gen.prTitle,
        head: branch,
        base: ctx.branch,
        body: `${gen.prBody}\n\nCloses #${issue.number}\n\n---\n<sub>🛟 Shipped by the GitHub Actions watchdog failover (Salesforce run missing today).</sub>`
      })
    ).data;
  note(`PR #${pr.number}: ${pr.html_url}`);

  await gh("POST", `/repos/${OWNER}/${REPO}/pulls/${pr.number}/reviews`, {
    event: "COMMENT",
    commit_id: headSha,
    body: `## 🔍 Automated Code Review\n\n${gen.codeReviewCritique}`
  }, { allow: [422] });

  try {
    await graphql(`mutation($id:ID!){ enablePullRequestAutoMerge(input:{pullRequestId:$id, mergeMethod:SQUASH}){ clientMutationId } }`, { id: pr.node_id });
    note("Auto-merge armed — merges as soon as CI passes.");
  } catch (e) {
    const m = await gh("PUT", `/repos/${OWNER}/${REPO}/pulls/${pr.number}/merge`, { merge_method: "squash" }, { allow: [405, 409] });
    note(m.ok ? "Merged (squash)." : `Merge pending: ${m.data.message || e.message}`);
  }

  await refreshProfile(gen.prTitle, pr.html_url);
  note("Profile README refreshed. Streak protected. 🛟");
}

main()
  .catch((e) => {
    note(`❌ ${e.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    if (GITHUB_STEP_SUMMARY) {
      appendFileSync(GITHUB_STEP_SUMMARY, `## 🛟 Watchdog failover\n\n\`\`\`\n${log.join("\n")}\n\`\`\`\n`);
    }
  });
