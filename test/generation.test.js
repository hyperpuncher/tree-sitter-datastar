const { test } = require("node:test");
const { execFileSync } = require("node:child_process");
const { resolve } = require("node:path");

test("bindings, scanner, and editor queries match their sources", () => {
  execFileSync(process.execPath, ["scripts/generate.js", "--check"], {
    cwd: resolve(__dirname, ".."),
    stdio: "pipe",
  });
});
