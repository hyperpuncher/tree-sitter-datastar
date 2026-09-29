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
- JS-compatible expressions: ternary, arrow functions, objects, arrays, regex literals
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
bunx tree-sitter generate        # regenerate parser from grammar.js
bun scripts/generate-queries.js  # regenerate host injections and Helix highlights
node-gyp rebuild                # rebuild the native addon after grammar changes
bunx tree-sitter test            # parser corpus
cargo test                      # Rust binding, queries, and separator checks
bun run test                    # Node binding
bun run test:injections         # requires installed host parsers
NVIM_TREESITTER=/path/to/nvim-treesitter bun run test:neovim  # real installation check
```

`bun run bench` measures full and incremental parsing with the rebuilt Node addon. Set `BENCH_ITERATIONS` to adjust the run length; timings are local baselines, not cross-machine performance guarantees.

Host injection queries distinguish expressions from plain signal names, attribute lists, and raw media queries. Dynamic JSX template substitutions are left to the host parser rather than injecting incomplete expression fragments. `bun run test:distribution` checks Make/CMake installation, package contents, and the Helix installer.

## Limitations

This is a partial JavaScript grammar, not a full JavaScript parser. Statements such as `new`, declarations, block-bodied functions, and comments are not supported. Template literals currently parse as strings without highlighting expressions inside `${...}`. Arbitrary custom attribute aliases are not supported.

## Project Structure

```
tree-sitter-datastar/
├── grammar.js
├── tree-sitter.json
├── src/
│   ├── parser.c
│   └── grammar.json
├── queries/
│   ├── datastar/                 # Neovim queries (rtp-discovered)
│   │   ├── highlights.scm
│   │   ├── indents.scm
│   │   └── textobjects.scm
│   ├── highlights-helix.scm      # Helix-specific capture names
│   └── injections-helix.scm
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
