const assert = require("node:assert/strict");
const { test } = require("node:test");
const { execFileSync } = require("node:child_process");
const { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const run = (command, args, options = {}) => execFileSync(command, args, {
  cwd: root,
  encoding: "utf8",
  stdio: "pipe",
  ...options,
});
const temporary = (t) => {
  const directory = mkdtempSync(join(tmpdir(), "datastar-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
};
const verifyInstall = (prefix) => {
  for (const query of ["highlights", "indents", "textobjects"]) {
    assert.equal(
      readFileSync(join(prefix, `share/tree-sitter/queries/datastar/${query}.scm`), "utf8"),
      readFileSync(join(root, `queries/datastar/${query}.scm`), "utf8"),
    );
  }
  const metadata = readFileSync(join(prefix, "lib/pkgconfig/tree-sitter-datastar.pc"), "utf8");
  assert.match(metadata, /URL: https:\/\/github.com\/hyperpuncher\/tree-sitter-datastar/);
  assert.match(metadata, /Description: Grammar for Datastar/);
  assert(!metadata.includes("@CMAKE_"));
};

test("CMake installs canonical queries and pkg-config metadata", (t) => {
  const temporaryDirectory = temporary(t);
  const build = join(temporaryDirectory, "build");
  const prefix = join(temporaryDirectory, "install");
  run("cmake", ["-S", ".", "-B", build, `-DCMAKE_INSTALL_PREFIX=${prefix}`, "-DCMAKE_INSTALL_LIBDIR=lib"]);
  run("cmake", ["--build", build]);
  run("cmake", ["--install", build]);
  verifyInstall(prefix);
});

test("Make installs canonical queries and pkg-config metadata", (t) => {
  const temporaryDirectory = temporary(t);
  const source = join(temporaryDirectory, "source");
  const prefix = join(temporaryDirectory, "install");
  mkdirSync(source);
  cpSync(join(root, "Makefile"), join(source, "Makefile"));
  cpSync(join(root, "src"), join(source, "src"), { recursive: true, filter: (path) => !path.endsWith(".o") });
  cpSync(join(root, "bindings/c"), join(source, "bindings/c"), { recursive: true });
  cpSync(join(root, "queries/datastar"), join(source, "queries/datastar"), { recursive: true });
  run("make", ["install", `PREFIX=${prefix}`], { cwd: source });
  verifyInstall(prefix);
});

test("packages contain queries, not build artifacts or the local review", (t) => {
  const directory = temporary(t);
  run("bun", ["pm", "pack", "--ignore-scripts", "--filename", join(directory, "package.tgz")]);
  const files = run("tar", ["-tf", join(directory, "package.tgz")]);
  for (const path of ["queries/datastar/highlights.scm", "after/queries/html/injections.scm", "docs/helix-html-injections.scm"]) {
    assert(files.includes(path), path);
  }
  assert(!files.includes("review.md"));
  assert(!files.includes("parser.o"));
  assert(!files.includes("scanner.c"));
  const cargo = run("cargo", ["package", "--list", "--allow-dirty"]);
  assert(cargo.includes("queries/datastar/highlights.scm"));
  assert(!cargo.includes("node_modules/"));
  assert(!cargo.includes("review.md"));
  assert(!cargo.includes("parser.o"));
});
