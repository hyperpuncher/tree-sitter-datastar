const { test } = require("node:test");
const { execFileSync } = require("node:child_process");
const { resolve } = require("node:path");

test("upstream artifacts match the JavaScript dependency", () => {
  execFileSync(process.execPath, ["scripts/generate-upstream.js", "--check"], {
    cwd: resolve(__dirname, ".."),
    stdio: "pipe",
  });
});

test("generated queries match their sources", () => {
  execFileSync(process.execPath, ["scripts/generate-queries.js", "--check"], {
    cwd: resolve(__dirname, ".."),
    stdio: "pipe",
  });
});
