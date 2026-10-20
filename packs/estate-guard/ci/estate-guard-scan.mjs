#!/usr/bin/env node
// estate-guard-scan.mjs — scans the *agentic surface* of a repo for the ways an
// autonomous agent (ours or someone else's) can be hijacked through it.
//
// What it looks at, and why:
//   workflows   pwn-requests, expression injection, agent-triggering workflows
//               that anyone can fire, unpinned actions, write-all permissions
//   claude      tracked settings.local.json, blanket Bash allow, bypass modes,
//               hooks that exec unpinned packages or machine paths, risky hooks
//   mcp         inline secrets, plaintext remote servers, unpinned npx -y
//   skills      prompt-injection directives, autonomy-escalation directives,
//               hidden unicode, imperative HTML comments, base64 blobs,
//               SKILL.md with no loadable frontmatter
//   secrets     live-looking credentials in tracked files, tracked .env files
//   web         Next.js routes using a service-role/admin client with no auth
//               signal, cron routes with no secret check, NEXT_PUBLIC_ secrets,
//               innerHTML from non-JSON sources, no CSP anywhere
//   deps        install scripts piping curl into a shell, lifecycle scripts
//
// Usage:
//   node estate-guard-scan.mjs --root <repo> [--public|--private] [--format md|json]
//        [--fail-on critical|high|medium|low|never] [--out <file>] [--config <json>]
//   node estate-guard-scan.mjs --estate <dir-of-repos> [--visibility map.json] [...]  # roll-up
//
// Exit codes: 0 clean at the fail-on level · 1 findings at/above it · 2 usage error.
// Only tracked files are scanned when the root is a git repo: what ships is what
// matters. Zero dependencies; node >= 18. Suppress one line with the comment
// `estate-guard: allow <RULE_ID>` on that line, or whole paths/rules via config.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1 };
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const DEFAULT_IGNORE = [
  '**/node_modules/**', '**/.git/**', '**/dist/**', '**/.next/**', '**/build/**',
  '**/*.lock', '**/pnpm-lock.yaml', '**/package-lock.json', '**/yarn.lock',
  '**/*.min.js', '**/*.map', '**/.obsidian/plugins/**',
];
// Paths whose job is to *talk about* attacks. Findings there are almost always
// examples, not directives. They stay scanned for secrets.
const DISCUSSION_PATHS = [
  '**/tests/**', '**/test/**', '**/__tests__/**', '**/*.test.*', '**/*.spec.*',
  '**/fixtures/**', '**/docs/**', '**/CHANGELOG*', '**/SECURITY.md', '**/content/**',
  '**/*security*/**', '**/*guard*/**', '**/*sentinel*/**', '**/*red-team*/**',
  '**/estate-guard/**',
];

// ----------------------------------------------------------------- helpers
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}
const matchers = (globs) => globs.map(globToRegex);
const matchesAny = (p, res) => res.some((r) => r.test(p));

function parseArgs(argv) {
  const a = { format: 'md', failOn: 'high', public: null, out: null, config: null, root: null, estate: null, visibility: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--root') a.root = v();
    else if (k === '--estate') a.estate = v();
    else if (k === '--format') a.format = v();
    else if (k === '--fail-on') a.failOn = v();
    else if (k === '--out') a.out = v();
    else if (k === '--config') a.config = v();
    else if (k === '--visibility') a.visibility = v();
    else if (k === '--public') a.public = true;
    else if (k === '--private') a.public = false;
    else if (k === '-h' || k === '--help') { console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 28).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
    else { console.error(`unknown argument: ${k}`); process.exit(2); }
  }
  if (!a.root && !a.estate) { console.error('usage: --root <repo> | --estate <dir>'); process.exit(2); }
  if (!(a.failOn in SEVERITY) && a.failOn !== 'never') { console.error('--fail-on must be critical|high|medium|low|never'); process.exit(2); }
  return a;
}

function listFiles(root) {
  try {
    const out = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    return out.split('\0').filter(Boolean);
  } catch {
    const acc = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(p); }
        else if (e.isFile()) acc.push(path.relative(root, p));
      }
    };
    walk(root);
    return acc;
  }
}

function isTracked(root, rel) {
  try { execFileSync('git', ['-C', root, 'ls-files', '--error-unmatch', rel], { stdio: 'ignore' }); return true; } catch { return false; }
}

function readText(root, rel) {
  const p = path.join(root, rel);
  let st;
  try { st = fs.lstatSync(p); } catch { return null; }
  if (!st.isFile() || st.size > MAX_FILE_BYTES) return null;
  const buf = fs.readFileSync(p);
  // binary sniff
  const head = buf.subarray(0, 8000);
  for (let i = 0; i < head.length; i++) if (head[i] === 0) return null;
  return buf.toString('utf8');
}

function loadConfig(root, explicit) {
  const candidates = [explicit, path.join(root, '.claude/ci/estate-guard/config.json')].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try { return JSON.parse(fs.readFileSync(c, 'utf8')); } catch (e) { console.error(`config ${c} is not valid JSON: ${e.message}`); process.exit(2); }
    }
  }
  return {};
}

// ------------------------------------------------------------------- rules
// Every rule: { id, severity, title, fix }. Findings reference the id.
export const RULES = {
  WF001: { severity: 'high', title: 'pull_request_target checks out the PR head', fix: 'Check out base.sha for trusted code; if the PR tree is needed, check it out to a separate path with persist-credentials:false and never run its scripts or expose secrets after it.' },
  WF002: { severity: 'high', title: 'Untrusted event text interpolated directly into a run: step', fix: 'Pass it through env: (e.g. `env: BODY: ${{ github.event.comment.body }}` then use "$BODY") so it is data, not shell.' },
  WF003: { severity: 'high', title: 'Agent-running workflow is triggerable by anyone and feeds them the prompt', fix: 'Gate the job with `github.event.comment.author_association` in OWNER/MEMBER/COLLABORATOR, keep the agent read-only or on a fork-safe ref, and do not pass raw comment text as the prompt.' },
  WF004: { severity: 'low', title: 'Third-party action not pinned to a commit SHA', fix: 'Pin to the full 40-char SHA with a version comment (`uses: owner/action@<sha> # vX.Y.Z`).' },
  WF005: { severity: 'high', title: 'Write permissions on a workflow that runs on untrusted events', fix: 'Default `permissions: contents: read`; elevate per job only where a write is needed and never on pull_request_target/issue_comment without an author gate.' },
  WF006: { severity: 'medium', title: 'Self-hosted runner used on a public repository', fix: 'Public repos should not use self-hosted runners for pull_request events (fork PRs can run code on your machine).' },
  WF007: { severity: 'medium', title: 'Untrusted event text passed into an action input (prompt/script injection)', fix: 'Agents and script actions treat inputs as instructions. Sanitize, quote, or pass only trusted fields.' },

  HK001: { severity: 'medium', title: 'settings.local.json is tracked in git', fix: 'It is per-machine by design. `git rm --cached` it and add it to .gitignore.' },
  HK002: { severity: 'high', title: 'Blanket Bash permission in Claude settings', fix: 'Replace `Bash(*)` with explicit command prefixes. A blanket allow makes every hook and skill a code-execution path.' },
  HK003: { severity: 'medium', title: 'Hook executes an unpinned remote package on every event', fix: 'Pin the version (`pkg@1.2.3`) or vendor the script. `@latest` on a hook means a compromised release runs with your privileges on the next edit.' },
  HK004: { severity: 'low', title: 'Hook references a machine-specific absolute path', fix: 'Use a repo-relative path. On any other machine this hook silently fails and the gate it implements does not exist.' },
  HK005: { severity: 'high', title: 'Hook script contains a destructive or remote-exec primitive', fix: 'Hooks run unattended on every event. Remove curl|sh, eval of tool input, recursive deletes outside a temp dir, and force-pushes.' },
  HK006: { severity: 'medium', title: 'enableAllProjectMcpServers is true in a tracked settings file', fix: 'Approve MCP servers explicitly. Auto-approving every project .mcp.json means a PR can add a server that runs on checkout.' },
  HK007: { severity: 'high', title: 'Permission bypass mode committed to the repo', fix: 'Remove bypassPermissions / skip-prompt settings from tracked config. Bypass is a per-session decision, never a repo default.' },

  MCP001: { severity: 'high', title: 'Inline secret-looking value in MCP server env', fix: 'Reference environment variables (`${VAR}`) and keep values in the machine keychain or .env (untracked).' },
  MCP002: { severity: 'low', title: 'MCP server launched with unpinned `npx -y`', fix: 'Pin the package version. `-y` plus no version = execute whatever the registry serves next.' },
  MCP003: { severity: 'high', title: 'Remote MCP server over plaintext http://', fix: 'Use https://. Tool calls and tokens travel in the clear otherwise.' },
  MCP004: { severity: 'low', title: 'MCP server command is a machine-specific absolute path', fix: 'Use a portable command or document that this entry is machine-local.' },

  SK001: { severity: 'high', title: 'Prompt-injection directive in agent-facing file', fix: 'Agent-facing files are system-prompt material. Remove the directive; if it is an example of what to refuse, quote it and negate it on the same line.' },
  SK002: { severity: 'medium', title: 'Autonomy-escalation directive in agent-facing file', fix: 'Directives like "never ask for confirmation" or "--dangerously-skip-permissions" widen what any injected instruction can do. Scope them to a named, reversible step or remove.' },
  SK003: { severity: 'low', title: 'Skill instructs fetching and executing unpinned remote code', fix: 'Pin versions and prefer vendored scripts. Count is informational unless the skill runs unattended.' },
  SK004: { severity: 'high', title: 'Hidden unicode (zero-width or bidi) in agent-facing file', fix: 'Strip it. Invisible text is read by the model and not by the reviewer.' },
  SK005: { severity: 'medium', title: 'HTML comment carrying an instruction to the agent', fix: 'Comments are invisible in rendered docs but fully visible to the model. Move the instruction into visible text or delete it.' },
  SK006: { severity: 'medium', title: 'Long base64 blob in agent-facing file', fix: 'Decode and review, or remove. Encoded payloads are the standard way to hide a directive from grep and from humans.' },
  SK007: { severity: 'low', title: 'SKILL.md has no loadable frontmatter (name + description)', fix: 'Add YAML frontmatter. Without it the skill never loads, so any gate it describes is not enforced.' },

  SEC001: { severity: 'critical', title: 'Credential-shaped token in a tracked file', fix: 'Rotate the credential now, then remove it from history (git filter-repo) and move it to an untracked .env or secret store.' },
  SEC002: { severity: 'high', title: 'Tracked .env file', fix: '`git rm --cached`, add to .gitignore, rotate anything inside, keep a .env.example instead.' },

  WEB001: { severity: 'high', title: 'Route uses a service-role/admin client with no authentication signal', fix: 'Verify the caller server-side (session via getUser(), signed webhook, or CRON_SECRET) before using an elevated client. Client-supplied userId is not authentication.' },
  WEB002: { severity: 'high', title: 'Cron route with no secret or authorization check', fix: 'Compare `Authorization: Bearer ${CRON_SECRET}` with timingSafeEqual before doing work.' },
  WEB003: { severity: 'high', title: 'NEXT_PUBLIC_ variable that looks like a secret', fix: 'NEXT_PUBLIC_ is inlined into the browser bundle. Rename and read it server-side only.' },
  WEB004: { severity: 'medium', title: 'dangerouslySetInnerHTML from a non-JSON source', fix: 'Sanitize (DOMPurify) or render via components. JSON-LD via JSON.stringify is fine; arbitrary strings are XSS.' },
  WEB005: { severity: 'low', title: 'No Content-Security-Policy configured anywhere', fix: 'Add a CSP (report-only first) in next.config headers, middleware/proxy, or vercel.json.' },

  DEP001: { severity: 'low', title: 'Lifecycle install script in package.json', fix: 'Review `preinstall`/`postinstall`; they run on every `pnpm install`, including in CI with secrets present.' },
  DEP002: { severity: 'medium', title: 'Install/setup script pipes a download into a shell', fix: 'Download, verify (checksum or signature), then execute. `curl | sh` runs whatever the server sends today.' },
};

// ----------------------------------------------------------------- patterns
const SECRET_PATTERNS = [
  /sk-ant-(?:api03-)?[A-Za-z0-9_-]{30,}/,
  /sk-proj-[A-Za-z0-9_-]{30,}/,
  /sk-or-v1-[0-9a-f]{40,}/,
  /\bghp_[A-Za-z0-9]{36}\b/, /\bgho_[A-Za-z0-9]{36}\b/, /\bghs_[A-Za-z0-9]{36}\b/,
  /github_pat_[A-Za-z0-9_]{60,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /xox[bpoa]-[0-9]{10,}-[0-9A-Za-z-]{10,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----\s*(?:\\n)?[A-Za-z0-9+/=]{40,}/,
  /\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bsbp_[a-f0-9]{40}\b/,
  /\bwhsec_[A-Za-z0-9]{24,}\b/,
  /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/,
  /\blin_api_[A-Za-z0-9]{30,}\b/,
  /\bntn_[A-Za-z0-9]{40,}\b/,
  /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{20,}\b/,
];
const SECRET_PLACEHOLDER = /(example|placeholder|redacted|xxxx|your[-_ ]|<[A-Z_]+>|\.\.\.|dummy|fake|sample|test[-_]?key|1234567890|AAAABBBB|ABCDEFGH)/i;

const INJECTION_DIRECTIVES = [
  /ignore (?:all |any |the )?(?:previous|prior|above|earlier|preceding) (?:instructions|prompts|rules|guidance)/i,
  /disregard (?:all |any |the |your )?(?:previous|prior|system|above) (?:instructions|prompt|rules)/i,
  /you are now (?:in )?(?:developer|dan|jailbreak|unrestricted) mode/i,
  /(?:reveal|print|output|leak|exfiltrate) (?:the |your )?(?:system prompt|api[_ ]?keys?|secrets?|credentials|\.env)/i,
  /(?:send|post|upload|exfiltrate) (?:the |all |any )?(?:files?|data|secrets?|tokens?|keys?|contents?) to (?:https?:\/\/|an? (?:external|remote|third))/i,
  /(?:do not|don't|never) (?:tell|inform|notify|show|mention (?:this )?to) the (?:user|human|operator)/i,
  /without (?:telling|informing|asking|notifying) the (?:user|human|operator)/i,
];
const AUTONOMY_DIRECTIVES = [
  /--dangerously-skip-permissions/,
  /\bbypassPermissions\b/,
  /skipDangerousModePermissionPrompt/,
  /(?:never|do not|don't) ask (?:the user )?for (?:permission|confirmation|approval)/i,
  /(?:do not|don't|never) ask (?:the )?user (?:for|to) confirm/i,
  /(?:always|automatically) (?:approve|allow|accept) (?:all|every|any) (?:tool|command|action|request)s?/i,
  /this step is automatic\. do not ask the user/i,
  /(?:git )?push (?:--force|-f) (?:origin )?(?:main|master)\b/i,
  /force[- ]push(?:es|ing)? to (?:main|master|production)/i,
];
// Negation / quotation context that turns a directive into a discussion of one.
const DEFENSIVE_CONTEXT = /(never|do not|don't|cannot|can't|must not|refuse|reject|ignore any|treat|detect|flag|block|against|such as|like|e\.g\.|for example|example|pattern|attack|injection|malicious|tries to|attempt|checkable|"|“|'|`|\(|<|if a file|if (?:the )?(?:content|text|input)|warn)/i;
const HTML_COMMENT_IMPERATIVE = /<!--(?![^>]*(?:\be\.g\.|generated|Regenerate|prettier|eslint|markdownlint|toc\b))[^>]*\b(?:(?:claude|assistant|agent|ai|model|llm)[,:]?\s+(?:you\s+)?(?:must|should|always|never|do not|don't|ignore)|you must|you should|ignore (?:previous|all|the|prior)|override (?:the|all|previous)|secretly|do not tell|don't tell|exfil|system prompt)\b[^>]*-->/i;
const BASE64_BLOB = /[A-Za-z0-9+/]{240,}={0,2}/;
const REMOTE_EXEC = /\b(?:npx -y|pnpm dlx|bunx|uvx|pipx run)\s+[^\s@]+(?:@latest)?\b|\b[^\s]+@latest\b|curl\s[^|\n]*\|\s*(?:ba|z)?sh\b|wget\s[^|\n]*\|\s*(?:ba|z)?sh\b|iwr\s[^|\n]*\|\s*iex\b/i;
const CURL_PIPE_SH = /\b(?:curl|wget)\s[^|\n]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b|iwr\s[^|\n]*\|\s*iex\b/i;
const MACHINE_PATH = /(?:^|[\s"'=(])(?:~\/|\$HOME\/|\$\{HOME\}\/|\/home\/[a-z]+\/|\/Users\/[a-z]+\/|[A-Z]:[\\/]Users[\\/]|%USERPROFILE%)/;
const UNTRUSTED_EVENT = /\$\{\{\s*github\.(?:event\.(?:issue|pull_request|comment|review|review_comment|discussion|discussion_comment)\.(?:title|body)|event\.comment\.body|head_ref|event\.pull_request\.head\.(?:ref|label)|event\.pull_request\.head\.repo\.(?:description|homepage)|event\.(?:commits|head_commit)[^}]*\.(?:message|author\.(?:name|email))|event\.workflow_run\.head_branch|event\.review\.body|event\.inputs\.[a-zA-Z_]+)\s*\}\}/;
const AGENT_ACTION = /uses:\s*["']?(?:anthropics\/claude-code-action|anthropics\/claude-code-base-action|openai\/codex-action|google-github-actions\/run-gemini-cli|github\/copilot-[a-z-]+)/i;
const AUTHOR_GATE = /author_association|github\.actor\s*==|actor\s*==|contains\(\s*fromJSON\([^)]*\),\s*github\.(?:actor|triggering_actor)/;

// -------------------------------------------------------------- the scanner
export function scanRepo(root, opts = {}) {
  root = path.resolve(root);
  const cfg = loadConfig(root, opts.config);
  const isPublic = opts.public !== null && opts.public !== undefined ? opts.public : (cfg.public ?? true); // unknown → public, fail-closed
  const ignoreRe = matchers([...DEFAULT_IGNORE, ...(cfg.ignore || [])]);
  const discussionRe = matchers([...DISCUSSION_PATHS, ...(cfg.discussion || [])]);
  const allowRules = new Set(cfg.allow || []);
  const findings = [];
  const stats = { files: 0, scanned: 0, workflows: 0, skills: 0, hooks: 0, routes: 0 };

  const add = (id, file, line, evidence, extra = {}) => {
    if (allowRules.has(id)) return;
    if (extra.lineText && new RegExp(`estate-guard:\\s*allow\\s+${id}`).test(extra.lineText)) return;
    const r = RULES[id];
    findings.push({ rule: id, severity: extra.severity || r.severity, title: r.title, file, line, evidence: String(evidence).slice(0, 160).replace(/\s+/g, ' ').trim(), fix: r.fix });
  };
  const lines = (txt) => txt.split(/\r?\n/);

  const files = listFiles(root).filter((f) => !matchesAny(f, ignoreRe));
  stats.files = files.length;
  const isDiscussion = (f) => matchesAny(f, discussionRe);
  const gitRepo = fs.existsSync(path.join(root, '.git'));
  const hasApp = files.some((f) => /^(?:apps\/[^/]+\/)?app\//.test(f));
  let cspSeen = false;

  for (const rel of files) {
    const text = readText(root, rel);
    if (text === null) continue;
    stats.scanned++;
    const base = path.basename(rel);
    const L = lines(text);

    // ------------------------------------------------------------- secrets
    if (!/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|pdf|mp3|mp4|wav)$/i.test(rel)) {
      for (let i = 0; i < L.length; i++) {
        const ln = L[i];
        if (ln.length > 4000) continue;
        const probe = /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----\s*$/.test(ln) ? ln + '\\n' + (L[i + 1] || '') : ln;
        for (const re of SECRET_PATTERNS) {
          const m = probe.match(re);
          if (m && !SECRET_PLACEHOLDER.test(ln) && !(isDiscussion(rel) && /(tests?|fixtures|spec)/.test(rel))) {
            add('SEC001', rel, i + 1, m[0].slice(0, 12) + '…', { lineText: ln });
            break;
          }
        }
      }
    }
    if (/(^|\/)\.env(\.[^/]+)?$/.test(rel) && !/\.(example|sample|template|md|txt)$/.test(rel) && (!gitRepo || isTracked(root, rel))) add('SEC002', rel, 1, 'tracked env file');

    // ----------------------------------------------------------- workflows
    if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(rel)) {
      stats.workflows++;
      const onBlock = text.match(/^on:\s*([\s\S]*?)(?=^\S)/m)?.[1] || text.match(/^on:.*$/m)?.[0] || '';
      const triggers = (onBlock.match(/\b(pull_request_target|issue_comment|issues|workflow_run|pull_request_review(?:_comment)?|discussion(?:_comment)?|pull_request)\b/g) || []);
      const untrustedTrigger = triggers.some((t) => ['pull_request_target', 'issue_comment', 'issues', 'workflow_run', 'pull_request_review', 'pull_request_review_comment', 'discussion', 'discussion_comment'].includes(t));
      const usesSecrets = /secrets\.(?!GITHUB_TOKEN)/.test(text);
      if (/pull_request_target/.test(onBlock)) {
        for (let i = 0; i < L.length; i++) {
          if (/ref:\s*\$\{\{\s*github\.event\.pull_request\.head\.(sha|ref)/.test(L[i])) {
            const window = L.slice(Math.max(0, i - 8), i + 8).join('\n');
            const safeCheckout = /persist-credentials:\s*false/.test(window) && /path:\s*\S+/.test(window);
            const after = L.slice(i).join('\n');
            const privilegedAfter = usesSecrets && /secrets\.(?!GITHUB_TOKEN)/.test(after) && !/EXPECTED_HEAD_SHA|trusted-base|base\.sha/.test(text);
            add('WF001', rel, i + 1, L[i], { lineText: L[i], severity: safeCheckout && !privilegedAfter ? 'medium' : 'high' });
          }
        }
      }
      let inRun = false, runIndent = -1, inWith = false, withIndent = -1, inEnv = false, envIndent = -1;
      for (let i = 0; i < L.length; i++) {
        const ln = L[i];
        const indent = Math.max(0, ln.search(/[^\s-]/)); // `- run:` and `run:` sit at the same logical depth
        if (/^\s*(?:-\s*)?run:\s*[|>]?\s*$/.test(ln) || /^\s*(?:-\s*)?run:\s*\S/.test(ln)) { inRun = true; runIndent = indent; inWith = false; inEnv = false; }
        else if (/^\s*(?:-\s*)?with:\s*$/.test(ln)) { inWith = true; withIndent = indent; inRun = false; inEnv = false; }
        else if (/^\s*(?:-\s*)?env:\s*$/.test(ln)) { inEnv = true; envIndent = indent; inRun = false; inWith = false; }
        else if (ln.trim() && indent <= runIndent && inRun) inRun = false;
        else if (ln.trim() && indent <= withIndent && inWith) inWith = false;
        else if (ln.trim() && indent <= envIndent && inEnv) inEnv = false;
        if (UNTRUSTED_EVENT.test(ln)) {
          if (inRun || /^\s*(?:-\s*)?run:\s*\S/.test(ln)) add('WF002', rel, i + 1, ln, { lineText: ln });
          else if (inWith) add('WF007', rel, i + 1, ln, { lineText: ln, severity: AGENT_ACTION.test(text) && !AUTHOR_GATE.test(text) ? 'high' : 'medium' });
          // in env: is the safe pattern — no finding
        }
        const uses = ln.match(/uses:\s*["']?([A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+)@([^\s"'#]+)/);
        if (uses && !/^(actions|github)\//.test(uses[1]) && !/^[0-9a-f]{40}$/.test(uses[2])) add('WF004', rel, i + 1, `${uses[1]}@${uses[2]}`, { lineText: ln });
        if (/runs-on:.*self-hosted/.test(ln) && isPublic) add('WF006', rel, i + 1, ln, { lineText: ln });
      }
      if (/permissions:\s*write-all/.test(text)) add('WF005', rel, L.findIndex((l) => /permissions:\s*write-all/.test(l)) + 1, 'permissions: write-all');
      else if (untrustedTrigger && /(contents|pull-requests|issues|packages|id-token):\s*write/.test(text) && !AUTHOR_GATE.test(text)) {
        const i = L.findIndex((l) => /(contents|pull-requests|issues|packages|id-token):\s*write/.test(l));
        const untrustedCodePath = /ref:\s*\$\{\{\s*github\.event\.pull_request\.head/.test(text) || findings.some((f) => f.file === rel && (f.rule === 'WF002' || f.rule === 'WF007'));
        add('WF005', rel, i + 1, L[i].trim(), { severity: isPublic && untrustedCodePath ? 'high' : 'medium' });
      }
      if (AGENT_ACTION.test(text) && untrustedTrigger && !AUTHOR_GATE.test(text)) {
        const i = L.findIndex((l) => AGENT_ACTION.test(l));
        const builtinGate = /anthropics\/claude-code-action/.test(text) && !/allowed_non_write_users|allowed_bots/.test(text); // the action refuses non-write actors by default
        add('WF003', rel, i + 1, L[i].trim(), { severity: isPublic && !builtinGate ? 'high' : 'medium' });
      }
    }

    // ------------------------------------------------------- claude config
    if (/(^|\/)\.claude\/settings(\.local)?\.json$/.test(rel)) {
      const local = /settings\.local\.json$/.test(rel);
      const tracked = !gitRepo || isTracked(root, rel);
      if (local && tracked) add('HK001', rel, 1, 'tracked');
      let d = null;
      try { d = JSON.parse(text); } catch { /* reported nowhere: not our rule */ }
      if (d && tracked) {
        const allow = d.permissions?.allow || [];
        for (const a of allow) if (/^(Bash|Bash\(\*\)|Bash\(\*:\*\)|\*)$/.test(a.trim())) add('HK002', rel, 1, a, { severity: local ? 'medium' : 'high' });
        const mode = d.permissions?.defaultMode || d.defaultMode;
        if (mode === 'bypassPermissions' || d.skipDangerousModePermissionPrompt || d.dangerouslySkipPermissions) add('HK007', rel, 1, `defaultMode=${mode}`);
        if (d.enableAllProjectMcpServers === true) add('HK006', rel, 1, 'enableAllProjectMcpServers: true');
        for (const ev of Object.values(d.hooks || {})) for (const e of ev) for (const h of e.hooks || []) {
          const cmd = h.command || '';
          if (/(?:npx|pnpm dlx|bunx|uvx)\s+(?:-y\s+)?[^\s]+@latest|(?:npx|pnpm dlx|bunx)\s+-y\s+[^\s@]+(?:\s|$)/.test(cmd)) add('HK003', rel, 1, cmd);
          if (MACHINE_PATH.test(cmd)) add('HK004', rel, 1, cmd);
          if (CURL_PIPE_SH.test(cmd)) add('HK005', rel, 1, cmd);
        }
      }
    }
    if (/(^|\/)\.claude\/hooks\/[^/]+\.(sh|py|js|mjs|cjs|ts|ps1)$/.test(rel) || /^hooks\/[^/]+\.(sh|py|js|mjs|cjs)$/.test(rel)) {
      stats.hooks++;
      for (let i = 0; i < L.length; i++) {
        const ln = L[i];
        if (/^\s*(#|\/\/|\*)/.test(ln)) continue;
        if (CURL_PIPE_SH.test(ln) || /\beval\s*\(?\s*["$]?\{?(?:TOOL_INPUT|tool_input|input)/.test(ln) || /rm\s+-rf?\s+(?:\/|~|\$HOME|"\$HOME|\$\{HOME\})(?:\s|$|")/.test(ln) || /git push\s+(?:--force|-f)\b/.test(ln)) add('HK005', rel, i + 1, ln, { lineText: ln });
      }
    }

    // ----------------------------------------------------------------- mcp
    if (/(^|\/)(\.mcp\.json|mcp\.json|claude_desktop_config\.json|\.cursor\/mcp\.json)$/.test(rel)) {
      let d = null; try { d = JSON.parse(text); } catch { /* skip */ }
      const servers = d?.mcpServers || (d && typeof d === 'object' && !Array.isArray(d) ? d : {});
      for (const [name, s] of Object.entries(servers)) {
        if (!s || typeof s !== 'object') continue;
        for (const [k, v] of Object.entries(s.env || {})) {
          if (typeof v !== 'string' || v.startsWith('${') || v.length < 16) continue;
          if (/(key|token|secret|password|passwd|auth|credential)/i.test(k) && !/^[A-Z_]+$/.test(v) && !/^[./~]|^[A-Z]:/.test(v)) add('MCP001', rel, 1, `${name}.env.${k}`);
          for (const re of SECRET_PATTERNS) if (re.test(v)) { add('SEC001', rel, 1, `${name}.env.${k}`); break; }
        }
        const args = (s.args || []).join(' ');
        if (s.command === 'npx' && /(^|\s)-y(\s|$)/.test(args) && !/@\d/.test(args)) add('MCP002', rel, 1, `${name}: npx ${args}`.slice(0, 120));
        if (typeof s.url === 'string' && /^http:\/\/(?!localhost|127\.0\.0\.1)/.test(s.url)) add('MCP003', rel, 1, `${name}: ${s.url}`);
        if (typeof s.command === 'string' && MACHINE_PATH.test(' ' + s.command)) add('MCP004', rel, 1, `${name}: ${s.command}`);
      }
    }

    // --------------------------------------------------------------- skills
    const agentFacing = /(^|\/)(SKILL|CLAUDE|AGENTS|GEMINI|GROK|CODEX|\.cursorrules|\.clinerules)[^/]*\.md$/i.test(rel)
      || /(^|\/)\.claude\/(agents|commands|skills)\//.test(rel) || /(^|\/)(agents|commands|skills|claws|\.agents|\.cursor\/rules|\.clinerules)\/.*\.(md|mdc)$/.test(rel) || /^\.cursorrules$/.test(rel);
    if (agentFacing) {
      if (/(^|\/)SKILL\.md$/.test(rel)) {
        stats.skills++;
        const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!fm || !/^name:\s*\S/m.test(fm[1]) || !/^description:\s*\S/m.test(fm[1])) add('SK007', rel, 1, fm ? 'frontmatter missing name/description' : 'no frontmatter');
      }
      {
        const body = text.replace(/^\uFEFF/, '').replace(/[^\x00-\x7F]\u200D(?=[^\x00-\x7F])/g, 'x'); // BOM and emoji joiners are not hiding anything
        const bidi = body.match(/[\u202A-\u202E\u2066-\u2069]/);
        const zw = body.match(/[\u200B\u200C\u200D\u2060\uFEFF]/);
        if (bidi) add('SK004', rel, body.slice(0, bidi.index).split('\n').length, 'bidi override U+' + bidi[0].codePointAt(0).toString(16));
        else if (zw) add('SK004', rel, body.slice(0, zw.index).split('\n').length, 'zero-width U+' + zw[0].codePointAt(0).toString(16), { severity: 'medium' });
      }
      if (!isDiscussion(rel)) {
        for (let i = 0; i < L.length; i++) {
          const ln = L[i];
          for (const re of INJECTION_DIRECTIVES) {
            const m = ln.match(re);
            if (m && !DEFENSIVE_CONTEXT.test(ln.slice(0, m.index) + ln.slice(m.index + m[0].length))) { add('SK001', rel, i + 1, ln, { lineText: ln }); break; }
          }
          for (const re of AUTONOMY_DIRECTIVES) {
            const m = ln.match(re);
            if (m && !DEFENSIVE_CONTEXT.test(ln.slice(0, m.index) + ln.slice(m.index + m[0].length))) { add('SK002', rel, i + 1, ln, { lineText: ln }); break; }
          }
          if (HTML_COMMENT_IMPERATIVE.test(ln) && !/Regenerate:|prettier-ignore|eslint|markdownlint|TOC|toc|GITHUB_VISUALS/.test(ln)) add('SK005', rel, i + 1, ln, { lineText: ln });
          if (BASE64_BLOB.test(ln) && !/data:image|\.svg|base64,|sha(?:256|512)-/.test(ln)) add('SK006', rel, i + 1, ln.slice(0, 60) + '…', { lineText: ln });
          if (REMOTE_EXEC.test(ln) && !/^\s*(#|\/\/)/.test(ln)) add('SK003', rel, i + 1, ln, { lineText: ln });
        }
      }
    }

    // ------------------------------------------------------------------ web
    if (/(^|\/)app\/.*\/route\.(ts|js|tsx)$/.test(rel)) {
      stats.routes++;
      const elevated = /SUPABASE_SERVICE_ROLE_KEY|service_role|createServiceClient|createAdminClient|serviceRole|getServiceSupabase|SUPABASE_SECRET_KEY/.test(text);
      const authSignal = /getUser\(|getSession\(|auth\(\)|authorization|CRON_SECRET|timingSafeEqual|verify\w*Signature|verifyWhopSignature|constructEvent|x-[a-z-]*key|apiKey|internal[-_]?key|bearer|requireAuth|withAuth|getServerSession|currentUser|clerk|isAdmin|checkAuth|validateRequest|assert\w*Auth|Unauthorized|rateLimit|ratelimit|assertSameOrigin|sameOrigin|turnstile|captcha/i.test(text); // abuse controls count for public-write routes
      const onlyEnvCheck = /Boolean\(\s*process\.env\.[A-Z_]*SERVICE_ROLE|!!process\.env\.[A-Z_]*SERVICE_ROLE|process\.env\.SUPABASE_SERVICE_ROLE_KEY\s*\)/.test(text) && !/createClient\(|createServiceClient|createAdminClient/.test(text);
      if (elevated && !authSignal && !onlyEnvCheck && !/\/(health|status|diagnostics|ready|live)\//.test(rel)) add('WEB001', rel, 1, 'service-role client, no auth signal');
      if (/cron/i.test(rel) && !/CRON_SECRET|authorization|timingSafeEqual/i.test(text)) add('WEB002', rel, 1, 'cron route without secret check');
    }
    if (/\.(ts|tsx|js|jsx|mjs|env\.example)$/.test(rel) && !isDiscussion(rel)) {
      const m = text.match(/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|SERVICE_KEY|API_SECRET|WEBHOOK_SECRET|PASSWORD)[A-Z0-9_]*/);
      if (m) add('WEB003', rel, L.findIndex((l) => l.includes(m[0])) + 1, m[0]);
    }
    if (/\.(tsx|jsx)$/.test(rel) && /dangerouslySetInnerHTML/.test(text)) {
      for (let i = 0; i < L.length; i++) {
        const m = L[i].match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]+)\}/);
        if (m && !/JSON\.stringify|ldJson|jsonLd|JsonLd|Ld\b|LD\b|schema|structuredData|DOMPurify|sanitize|serializeJsonLd|safeJsonLd|Css\b|CSS\b|svg/i.test(m[1])) add('WEB004', rel, i + 1, m[1].trim().slice(0, 80), { lineText: L[i] });
      }
    }
    if (/(^|\/)(next\.config\.[cm]?[jt]s|middleware\.ts|proxy\.ts|vercel\.json)$/.test(rel) && /Content-Security-Policy/.test(text)) cspSeen = true;

    // ----------------------------------------------------------------- deps
    if (base === 'package.json' && rel.split('/').length <= 3) {
      try { const d = JSON.parse(text); for (const k of ['preinstall', 'postinstall', 'prepare']) if (d.scripts?.[k] && !/^(husky|lefthook|simple-git-hooks|pnpm run build|turbo|tsc|next build|npm run build)/.test(d.scripts[k])) add('DEP001', rel, 1, `${k}: ${d.scripts[k]}`.slice(0, 120)); } catch { /* skip */ }
    }
    if (/\.(sh|ps1|bash|zsh)$/.test(rel) || /(^|\/)(install|setup|bootstrap)[^/]*\.(sh|mjs|js|py)$/.test(rel)) {
      for (let i = 0; i < L.length; i++) if (CURL_PIPE_SH.test(L[i]) && !/^\s*#/.test(L[i])) add('DEP002', rel, i + 1, L[i], { lineText: L[i] });
    }
  }
  if (hasApp && !cspSeen) add('WEB005', '(repo)', 0, 'no CSP in next.config / middleware / proxy / vercel.json');

  findings.sort((a, b) => SEVERITY[b.severity] - SEVERITY[a.severity] || a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.line - b.line);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;
  return { repo: path.basename(root), root, public: isPublic, scannedAt: new Date().toISOString(), stats, counts, findings };
}

// ------------------------------------------------------------------ output
export function toMarkdown(reports) {
  const out = [];
  const total = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of reports) for (const k of Object.keys(total)) total[k] += r.counts[k];
  out.push(`# estate-guard scan — ${reports.length === 1 ? reports[0].repo : reports.length + ' repos'}`);
  out.push('');
  out.push(`Scanned ${reports.map((r) => r.repo).join(', ')} at ${reports[0]?.scannedAt?.slice(0, 16).replace('T', ' ')} UTC.`);
  out.push('');
  out.push('| Severity | Count |'); out.push('|---|---|');
  for (const k of ['critical', 'high', 'medium', 'low']) out.push(`| ${k} | ${total[k]} |`);
  out.push('');
  if (reports.length > 1) {
    out.push('## Per repo'); out.push(''); out.push('| Repo | Public | Files | Workflows | Skills | Hooks | Routes | Crit | High | Med | Low |'); out.push('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of reports) out.push(`| ${r.repo} | ${r.public ? 'yes' : 'no'} | ${r.stats.scanned} | ${r.stats.workflows} | ${r.stats.skills} | ${r.stats.hooks} | ${r.stats.routes} | ${r.counts.critical} | ${r.counts.high} | ${r.counts.medium} | ${r.counts.low} |`);
    out.push('');
  }
  const byRule = new Map();
  for (const r of reports) for (const f of r.findings) { const k = f.rule; if (!byRule.has(k)) byRule.set(k, []); byRule.get(k).push({ ...f, repo: r.repo }); }
  const ruleOrder = [...byRule.keys()].sort((a, b) => SEVERITY[RULES[b].severity] - SEVERITY[RULES[a].severity] || a.localeCompare(b));
  out.push('## Findings'); out.push('');
  for (const id of ruleOrder) {
    const fs_ = byRule.get(id);
    const sev = fs_[0].severity;
    out.push(`### ${id} · ${sev} · ${RULES[id].title} (${fs_.length})`); out.push('');
    out.push(`Fix: ${RULES[id].fix}`); out.push('');
    const shown = fs_.slice(0, 25);
    for (const f of shown) out.push(`- ${reports.length > 1 ? '`' + f.repo + '` ' : ''}\`${f.file}${f.line ? ':' + f.line : ''}\` — ${f.evidence.replace(/`/g, "'")}`);
    if (fs_.length > shown.length) out.push(`- … ${fs_.length - shown.length} more`);
    out.push('');
  }
  if (!ruleOrder.length) out.push('No findings.');
  return out.join('\n');
}

// -------------------------------------------------------------------- main
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const a = parseArgs(process.argv.slice(2));
  const reports = [];
  if (a.estate) {
    for (const e of fs.readdirSync(a.estate, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = path.join(a.estate, e.name);
      if (!fs.existsSync(path.join(p, '.git'))) continue;
      let pub = a.public;
      if (a.visibility) { const vis = JSON.parse(fs.readFileSync(a.visibility, 'utf8')); if ((vis.private || []).includes(e.name)) pub = false; else if ((vis.public || []).includes(e.name)) pub = true; }
      reports.push(scanRepo(p, { public: pub, config: a.config }));
    }
  } else reports.push(scanRepo(a.root, { public: a.public, config: a.config }));
  const text = a.format === 'json' ? JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2) : toMarkdown(reports);
  if (a.out) fs.writeFileSync(a.out, text + '\n'); else process.stdout.write(text + '\n');
  if (a.failOn === 'never') process.exit(0);
  const threshold = SEVERITY[a.failOn];
  const bad = reports.some((r) => r.findings.some((f) => SEVERITY[f.severity] >= threshold));
  process.exit(bad ? 1 : 0);
}
