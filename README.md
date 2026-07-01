# tree-sitter-datastar

Tree-sitter grammar for [Datastar](https://data-star.dev) expressions and attributes.

## Installation

### Neovim

Uses [lazy.nvim](https://github.com/folke/lazy.nvim) + [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter):

```lua
{ 'hyperpuncher/tree-sitter-datastar', dependencies = { 'nvim-treesitter/nvim-treesitter' } },
```

### Helix

```bash
./install-helix.sh
```

Then add to `~/.config/helix/languages.toml`:

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
- Signal references: `$user.name`, `$items[0]`, `$data?.user?.email`
- Action calls: `@post('/data', { id: $userId })`
- JS-compatible expressions: ternary, arrow functions, objects, arrays, regex literals
- Injection-based: works inside HTML, Templ, JSX, TSX files (no standalone filetype)

## Supported Plugins

`attr`, `bind`, `class`, `computed`, `effect`, `ignore`, `ignore-morph`, `indicator`, `init`, `json-signals`, `on`, `on-intersect`, `on-interval`, `on-signal-patch`, `on-signal-patch-filter`, `preserve-attr`, `ref`, `show`, `signals`, `style`, `text`, `animate`, `custom-validity`, `on-raf`, `on-resize`, `persist`, `query-string`, `replace-url`, `rocket`, `scroll-into-view`, `view-transition`

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
tree-sitter generate   # regenerate parser.c from grammar.js
tree-sitter test       # run tests
```

## Project Structure

```
tree-sitter-datastar/
├── grammar.js
├── tree-sitter.json
├── src/
│   ├── parser.c
│   ├── scanner.c
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
