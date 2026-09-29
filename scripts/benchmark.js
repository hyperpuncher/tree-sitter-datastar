// Run after rebuilding the Node addon: bun run bench
const { performance } = require("node:perf_hooks");
const { statSync } = require("node:fs");
const { resolve } = require("node:path");
const Parser = require("tree-sitter");
const parser = new Parser();
parser.setLanguage(require("../bindings/node"));
const iterations = Number(process.env.BENCH_ITERATIONS || 1000);
if (!Number.isInteger(iterations) || iterations < 1) throw new Error("BENCH_ITERATIONS must be a positive integer");

const measure = (name, operation) => {
  for (let i = 0; i < 50; i++) operation();
  const samples = [];
  for (let sample = 0; sample < 5; sample++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) operation();
    samples.push((performance.now() - start) / iterations);
  }
  samples.sort((a, b) => a - b);
  console.log(`${name}: ${samples[2].toFixed(4)} ms/parse (median of 5 runs)`);
};
console.log(`parser.c: ${statSync(resolve(__dirname, "../src/parser.c")).size} bytes`);
for (const [name, source, valid] of [
  ["reactive expression", "$user.name && $items[$index]?.label || 'Loading'", true],
  ["filtered backend request", "@query('/search', {filterSignals: {include: /^form\\./, exclude: /_temp$/}})", true],
  ["long statement sequence", "$count++; ".repeat(200), true],
  ["malformed attribute during editing", "data-on:__debounce.300ms", false],
]) {
  if (parser.parse(source).rootNode.hasError === valid) throw new Error(`unexpected benchmark parse: ${name}`);
  measure(name, () => parser.parse(source));
}

let source = "data-on:click__debounce.300ms";
let tree = parser.parse(source);
measure("incremental attribute edit", () => {
  const next = source.includes("click") ? "input" : "click";
  tree.edit({
    startIndex: 8, oldEndIndex: 13, newEndIndex: 13,
    startPosition: { row: 0, column: 8 },
    oldEndPosition: { row: 0, column: 13 },
    newEndPosition: { row: 0, column: 13 },
  });
  source = `data-on:${next}__debounce.300ms`;
  tree = parser.parse(source, tree);
});
