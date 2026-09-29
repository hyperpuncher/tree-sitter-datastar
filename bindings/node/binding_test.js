const assert = require("node:assert/strict");
const { test } = require("node:test");
const Parser = require("tree-sitter");
const language = require(".");

const createParser = () => {
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
};

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
  ]) {
    assert(!parser.parse(source).rootNode.hasError, source);
  }
  for (const source of ["data-on:__window", "data-on: click", "$count++ @get('/save')"]) {
    assert(parser.parse(source).rootNode.hasError, source);
  }
  const sequence = parser.parse("$count++; ".repeat(200)).rootNode.namedChild(0);
  assert.equal(sequence.type, "sequence_expression");
  assert.equal(sequence.namedChildCount, 200);
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
