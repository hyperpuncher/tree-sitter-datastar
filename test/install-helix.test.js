const assert = require("node:assert/strict");
const { test } = require("node:test");
const { execFileSync, spawnSync } = require("node:child_process");
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { dirname, join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const configuration = (t) => {
  const directory = mkdtempSync(join(tmpdir(), "datastar-helix-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
};
const install = (config, args = []) => execFileSync("bash", ["install-helix.sh", ...args], {
  cwd: root,
  env: { ...process.env, XDG_CONFIG_HOME: config, CC: "cc", CFLAGS: "-O2" },
  stdio: "pipe",
});

test("Helix installation honors XDG paths and installs HTML queries idempotently", (t) => {
  const config = configuration(t);
  install(config, ["--html"]);
  install(config, ["--html"]);
  const runtime = join(config, "helix/runtime");
  const grammar = readFileSync(join(runtime, "grammars/datastar.so"));
  assert(grammar.length > 0);
  for (const [destination, source] of [
    ["queries/datastar/highlights.scm", "queries/highlights-helix.scm"],
    ["queries/html/injections.scm", "docs/helix-html-injections.scm"],
  ]) {
    assert.equal(readFileSync(join(runtime, destination), "utf8"), readFileSync(join(root, source), "utf8"));
  }
});

test("Helix installer preserves custom host queries", (t) => {
  const config = configuration(t);
  const query = join(config, "helix/runtime/queries/html/injections.scm");
  mkdirSync(dirname(query), { recursive: true });
  writeFileSync(query, "; custom host queries\n");
  assert.throws(() => install(config, ["--html"]), /Existing HTML queries were not changed/);
  assert.equal(readFileSync(query, "utf8"), "; custom host queries\n");
  assert(!existsSync(join(config, "helix/runtime/grammars/datastar.so")));
  install(config);
  assert.equal(readFileSync(query, "utf8"), "; custom host queries\n");
});

test("Helix installer rejects an unavailable compiler before installing files", (t) => {
  const config = configuration(t);
  const result = spawnSync("bash", ["install-helix.sh"], {
    cwd: root,
    env: { ...process.env, XDG_CONFIG_HOME: config, CC: "/nonexistent/datastar-cc" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /C compiler not found/);
  assert(!existsSync(join(config, "helix")));
});
