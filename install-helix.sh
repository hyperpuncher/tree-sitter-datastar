#!/usr/bin/env bash
# Install tree-sitter-datastar parser for Helix.
# For Neovim: use the plugin directly, no script needed.
#   { 'hyperpuncher/tree-sitter-datastar', branch = 'main' }
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for C compiler
if ! command -v gcc &>/dev/null && ! command -v clang &>/dev/null; then
	echo "Error: gcc or clang not found"
	exit 1
fi
CC=$(command -v gcc || command -v clang)

if ! command -v hx &>/dev/null; then
	echo "Error: Helix not found"
	exit 1
fi

PARSER_DIR="$HOME/.config/helix/runtime/grammars"
QUERIES_DIR="$HOME/.config/helix/runtime/queries/datastar"

mkdir -p "$PARSER_DIR" "$QUERIES_DIR"

echo "Compiling parser..."
$CC -shared -fPIC -o "$PARSER_DIR/datastar.so" \
	"$SCRIPT_DIR/src/parser.c" "$SCRIPT_DIR/src/scanner.c" -I"$SCRIPT_DIR/src"

echo "Installing queries..."
cp "$SCRIPT_DIR/queries/highlights-helix.scm" "$QUERIES_DIR/highlights.scm"
cp "$SCRIPT_DIR/queries/injections-helix.scm" "$QUERIES_DIR/injections.scm"

echo "Done. Add to ~/.config/helix/languages.toml:"
echo ""
echo "[[language]]"
echo "name = \"datastar\""
echo "scope = \"source.datastar\""
echo "file-types = []"
echo ""
echo "[[grammar]]"
echo "name = \"datastar\""
echo "source = { path = \"$SCRIPT_DIR\" }"
