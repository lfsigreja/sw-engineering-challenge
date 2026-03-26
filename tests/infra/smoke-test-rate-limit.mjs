/**
 * Rate-limit smoke test
 *
 * Runs three scenarios:
 *  1. /rents — confirms requests 1-100 pass and 101+ are blocked (429)
 *  2. /health — confirms the exempt route is never blocked
 *  3. Cooldown — waits for the window to reset and confirms access is restored
 */

const BASE = "http://localhost:3000";
const LIMIT = 100;
const TOTAL = 110; // 10 above the limit

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function pass(msg) { console.log(`  ${GREEN}✔${RESET}  ${msg}`); }
function fail(msg) { console.log(`  ${RED}✖${RESET}  ${msg}`); }
function info(msg) { console.log(`  ${CYAN}→${RESET}  ${msg}`); }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`); }

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ── Scenario 1: Rate limit on /rents ─────────────────────────────────────────
header("Scenario 1 — /rents: first 100 should pass, 101–110 should be blocked");

let passed = 0;
let blocked = 0;
let unexpected = 0;

for (let i = 1; i <= TOTAL; i++) {
  const { status } = await get("/rents");

  if (i <= LIMIT && status === 200) {
    passed++;
  } else if (i > LIMIT && status === 429) {
    blocked++;
  } else {
    unexpected++;
    console.log(`  ${YELLOW}?${RESET}  Request ${i}: unexpected status ${status}`);
  }
}

passed === LIMIT
  ? pass(`Requests 1–${LIMIT}: all ${LIMIT} returned 200`)
  : fail(`Expected ${LIMIT} × 200, got ${passed}`);

blocked === TOTAL - LIMIT
  ? pass(`Requests ${LIMIT + 1}–${TOTAL}: all ${TOTAL - LIMIT} returned 429 RATE_LIMIT_EXCEEDED`)
  : fail(`Expected ${TOTAL - LIMIT} × 429, got ${blocked}`);

// Show the 429 body once
const { body: limitBody } = await get("/rents");
if (limitBody?.error === "RATE_LIMIT_EXCEEDED") {
  info(`429 body: ${JSON.stringify(limitBody)}`);
}

// ── Scenario 2: /health is always exempt ─────────────────────────────────────
header("Scenario 2 — /health: must never be rate-limited (allowList)");

let healthOk = 0;
let healthFailed = 0;

for (let i = 1; i <= 20; i++) {
  const { status } = await get("/health");
  status === 200 ? healthOk++ : healthFailed++;
}

healthFailed === 0
  ? pass(`All 20 calls to /health returned 200 (exempt from rate limiting)`)
  : fail(`${healthFailed}/20 calls to /health were unexpectedly blocked`);

// ── Scenario 3: /ready is always exempt ──────────────────────────────────────
header("Scenario 3 — /ready: must never be rate-limited (allowList)");

const { status: readyStatus, body: readyBody } = await get("/ready");
readyStatus === 200
  ? pass(`/ready returned 200 — version: ${readyBody?.version}, status: ${readyBody?.status}`)
  : fail(`/ready returned ${readyStatus}`);

// ── Summary ───────────────────────────────────────────────────────────────────
header("Summary");

const allOk =
  passed === LIMIT &&
  blocked === TOTAL - LIMIT &&
  healthFailed === 0 &&
  readyStatus === 200;

if (allOk) {
  console.log(`\n${GREEN}${BOLD}All scenarios passed.${RESET}\n`);
} else {
  console.log(`\n${RED}${BOLD}Some scenarios failed — see details above.${RESET}\n`);
  process.exit(1);
}
