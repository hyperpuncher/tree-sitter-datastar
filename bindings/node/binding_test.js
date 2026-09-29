const assert = require("node:assert/strict");
const { test } = require("node:test");
const Parser = require("tree-sitter");
const language = require(".");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const createParser = () => {
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
};

const createHighlightQuery = () => new Parser.Query(language,
  readFileSync(resolve(__dirname, "../../queries/datastar/highlights.scm"), "utf8"));

test("can load grammar", () => {
  assert.doesNotThrow(createParser);
});

test("native binding parses current Datastar syntax", () => {
  const parser = createParser();
  for (const source of [
    "", "$$count += 1", "$123 + $foo.0.name", "$count--",
    "@query('/endpoint', {payload: {foo: $foo}},)",
    "letter, row in $$letters.filter(Boolean)",
    "data-star-bind:_foo_bar__root__prop.value__event.input.change",
    "$controller = new AbortController(); @get('/endpoint')",
    "@peek(() => { const value = $foo; return value + 1 })",
    "`count: ${$$count}`", "$controller?.abort?.()", "{foo: $foo, value}",
  ]) {
    assert(!parser.parse(source).rootNode.hasError, source);
  }
  for (const source of ["data-on:__window", "data-on: click", "$count++ @get('/save')", "$count++\n@get('/save')"]) {
    assert(parser.parse(source).rootNode.hasError, source);
  }
  const program = parser.parse("$count++; ".repeat(200)).rootNode;
  assert.equal(program.type, "program");
  assert.equal(program.namedChildCount, 200);
});

test("signals and actions inside template interpolation are highlighted", () => {
  const query = createHighlightQuery();
  const source = "`value: ${$count + @peek(() => $$local)}`; '$notASignal'";
  const captures = query.captures(createParser().parse(source).rootNode)
    .filter(({ name }) => name.endsWith(".datastar"))
    .map(({ name, node }) => [name, node.text]);
  assert.deepEqual(captures, [
    ["variable.builtin.datastar", "$count"],
    ["function.builtin.datastar", "@peek"],
    ["variable.builtin.datastar", "$$local"],
  ]);
});

test("attribute delimiters are distinct from ternary operators", () => {
  const query = createHighlightQuery();
  for (const [source, token, expected] of [
    ["data-on:click", ":", ["punctuation.delimiter"]],
    ["$ready ? $a : $b", ":", ["operator"]],
    ["$ready ? $a : $b", "?", ["operator"]],
  ]) {
    const captures = query.captures(createParser().parse(source).rootNode)
      .filter(({ node }) => node.text === token)
      .map(({ name }) => name);
    assert.deepEqual(captures, expected, source);
  }
});

test("incremental template edits match a fresh parse", () => {
  const parser = createParser();
  const prefix = "`value: ${";
  const suffix = "}`";
  let expression = "$count";
  let tree = parser.parse(prefix + expression + suffix);
  for (const replacement of ["@peek(() => $$count)", "($count + ", "$count"]) {
    tree.edit({
      startIndex: prefix.length,
      oldEndIndex: prefix.length + expression.length,
      newEndIndex: prefix.length + replacement.length,
      startPosition: { row: 0, column: prefix.length },
      oldEndPosition: { row: 0, column: prefix.length + expression.length },
      newEndPosition: { row: 0, column: prefix.length + replacement.length },
    });
    const source = prefix + replacement + suffix;
    tree = parser.parse(source, tree);
    assert.equal(tree.rootNode.toString(), createParser().parse(source).rootNode.toString(), source);
    expression = replacement;
  }
});

test("incremental key and modifier edits match a fresh parse", () => {
  const parser = createParser();
  let source = "data-on:click__window";
  let tree = parser.parse(source);
  for (const replacement of ["_", "__", "_foo_bar", "click"]) {
    const startIndex = 8;
    const oldEndIndex = source.indexOf("__window");
    const updated = source.slice(0, startIndex) + replacement + source.slice(oldEndIndex);
    tree.edit({
      startIndex, oldEndIndex, newEndIndex: startIndex + replacement.length,
      startPosition: { row: 0, column: startIndex },
      oldEndPosition: { row: 0, column: oldEndIndex },
      newEndPosition: { row: 0, column: startIndex + replacement.length },
    });
    tree = parser.parse(updated, tree);
    assert.equal(tree.rootNode.toString(), createParser().parse(updated).rootNode.toString(), updated);
    source = updated;
  }
});
