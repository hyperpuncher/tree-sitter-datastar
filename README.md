# tree-sitter-datastar

Tree-sitter grammar for [Datastar](https://data-star.dev) v1.0.4 expressions and attributes, including Pro attributes and Rocket template syntax.

## Installation

### Neovim

Uses [lazy.nvim](https://github.com/folke/lazy.nvim) + the current `main` branch of [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter), with Neovim 0.12+ and its required system tree-sitter CLI. The legacy `master` branch is not supported:

```lua
{ 'hyperpuncher/tree-sitter-datastar', dependencies = { 'nvim-treesitter/nvim-treesitter' } },
```

### Helix

```bash
./install-helix.sh --html
```

The script honors `XDG_CONFIG_HOME`, `CC`, and `CFLAGS`, and refuses to overwrite custom HTML queries. If you already have host queries, merge `docs/helix-html-injections.scm` manually and run without `--html`.

Then add to `~/.config/helix/languages.toml` (or the corresponding XDG config path):

```toml
[[language]]
name = "datastar"
scope = "source.datastar"
file-types = []

[[grammar]]
name = "datastar"
source = { path = "/path/to/tree-sitter-datastar" }
```

## Features

- Parses Datastar attribute names: `data-on:click__debounce.500ms` → plugin, key, modifiers
- Parses Datastar expressions: `$count++`, `@get('/api')`, `{ foo: $bar }`
- Signal references: `$user.name`, `$items[0]`, `$data?.user?.email`, `$123`, `$['foo-bar']`
- Rocket local signals (`$$count`), structural attributes, and `data-for` aliases
- Official `data-star-*` aliases and the CSP `data-nonce` attribute
- Action calls: `@post('/data', { id: $userId })`
- JavaScript syntax from `tree-sitter-javascript`: constructors, declarations, block-bodied functions, comments, template interpolation, optional calls, modern literals, and operators
- Injection-based: works inside HTML, Templ, JSX, TSX files (no standalone filetype)

## Supported Plugins

`attr`, `bind`, `class`, `computed`, `effect`, `ignore`, `ignore-morph`, `indicator`, `init`, `json-signals`, `nonce`, `on`, `on-intersect`, `on-interval`, `on-signal-patch`, `on-signal-patch-filter`, `preserve-attr`, `ref`, `show`, `signals`, `style`, `text`, `animate`, `custom-validity`, `match-media`, `on-raf`, `on-resize`, `persist`, `query-string`, `replace-url`, `scroll-into-view`, `view-transition`, `if`, `else-if`, `else`, `for`

## Highlight Groups

| Capture                                       | Meaning                                        |
| --------------------------------------------- | ---------------------------------------------- |
| `@variable.builtin.datastar`                  | Signal references (`$count`)                   |
| `@function.builtin.datastar`                  | Action calls (`@get`)                          |
| `@tag.builtin`                                | Plugin names (`on`, `bind`)                    |
| `@property`                                   | Keys and modifiers (`click`, `debounce.500ms`) |
| `@tag.attribute`                              | `data-` prefix                                 |
| `@string.regex`                               | Regex literals                                 |
| `@operator`, `@string`, `@number`, `@keyword` | Standard JS                                    |

## Development

```bash
git clone https://github.com/hyperpuncher/tree-sitter-datastar
cd tree-sitter-datastar
bun install
bun run generate                # regenerate parser, upstream scanner, and all queries
node-gyp rebuild                # rebuild the native addon after grammar changes
bun run test                    # parser corpus, Node binding, and generated artifacts
cargo test                      # Rust binding, queries, and separator checks
go -C bindings/go test ./...     # Go binding
uv run --extra core python -m unittest discover -s bindings/python/tests
bun run test:injections         # requires installed host parsers
NVIM_TREESITTER=/path/to/nvim-treesitter bun run test:neovim  # real installation check
```

`bun run bench` measures full and incremental parsing with the rebuilt Node addon. Set `BENCH_ITERATIONS` to adjust the run length; timings are local baselines, not cross-machine performance guarantees.

Host injection queries distinguish expressions from plain signal names, attribute lists, and raw media queries. Dynamic JSX template substitutions are left to the host parser rather than injecting incomplete expression fragments. `bun run test:distribution` checks Make/CMake installation, package contents, and the Helix installer.

## Syntax-tree migration

The grammar now extends `tree-sitter-javascript`. Consumers of the old partial grammar must update their queries and node lookups:

| Previous node | Current node |
| --- | --- |
| `source_file` | `program` |
| `assignment_statement` | `assignment_expression` or `augmented_assignment_expression`, inside an `expression_statement` |
| `string_literal` | `string` or `template_string` |
| `number_literal` | `number` |
| `regex_literal` | `regex` |
| `boolean_literal` | `true` or `false` |
| `computed_member_expression` | `subscript_expression` |
| `conditional_expression` | `ternary_expression` |

JavaScript fields and node shapes follow upstream. The old `literal` and `primary_expression` wrappers are gone. Semicolon-separated statements are siblings under `program`; comma sequences still use `sequence_expression`. Datastar attribute, signal, and action node names are preserved.

## Limitations

Datastar expressions still require semicolons between statements; newline-only JavaScript automatic semicolon insertion is intentionally disabled. Parsing JavaScript syntax does not guarantee that Datastar's runtime can evaluate it in every attribute context. Arbitrary custom attribute aliases and reconstruction of dynamic host-template substitutions are not supported.

The generated parser is larger than the previous subset parser. The benefit is broader syntax coverage and less custom grammar code, not a parser-size reduction.

## Project Structure

```
tree-sitter-datastar/
├── grammar.js                   # Datastar extension of the JavaScript grammar
├── scripts/                     # reproducible upstream/query generation and benchmarks
├── tree-sitter.json
├── src/
│   ├── parser.c
│   ├── scanner.c                # generated upstream scanner with Datastar separator policy
│   └── grammar.json
├── queries/
│   ├── datastar/                 # Neovim queries (rtp-discovered)
│   │   ├── highlights.scm
│   │   ├── indents.scm
│   │   └── textobjects.scm
│   └── highlights-helix.scm      # Helix-specific capture names
├── after/queries/                # Neovim injection queries
│   ├── html/injections.scm
│   ├── templ/injections.scm
│   ├── jsx/injections.scm
│   └── tsx/injections.scm
├── lua/tree-sitter-datastar/     # Neovim plugin
│   └── init.lua
├── plugin/                       # Auto-load
│   └── tree-sitter-datastar.lua
├── install-helix.sh
├── Cargo.toml                    # Rust crate (LSP dep)
└── bindings/                     # Language bindings (auto-generated)
```

## License

MIT
