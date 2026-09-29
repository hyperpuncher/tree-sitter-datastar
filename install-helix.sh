#!/usr/bin/env bash
# Install the parser and queries. --html also installs host-language injections.
set -euo pipefail

INSTALL_HTML=false
case "${1:-}" in
	"") ;;
	--html) INSTALL_HTML=true ;;
	*) echo "Usage: $0 [--html]" >&2; exit 1 ;;
esac
if (( $# > 1 )); then
	echo "Usage: $0 [--html]" >&2
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/helix"
RUNTIME_DIR="$CONFIG_DIR/runtime"
HTML_QUERY="$RUNTIME_DIR/queries/html/injections.scm"
HTML_SOURCE="$SCRIPT_DIR/docs/helix-html-injections.scm"

# Never replace a user's existing host queries.
if $INSTALL_HTML && [[ -e "$HTML_QUERY" ]] && ! cmp -s "$HTML_SOURCE" "$HTML_QUERY"; then
	echo "Existing HTML queries were not changed: $HTML_QUERY" >&2
	echo "Merge $HTML_SOURCE into that file manually, then run without --html." >&2
	exit 1
fi

read -r -a COMPILER <<< "${CC:-cc}"
if ! command -v "${COMPILER[0]}" >/dev/null; then
	echo "C compiler not found: ${COMPILER[0]}" >&2
	exit 1
fi
read -r -a FLAGS <<< "${CFLAGS:--O2}"

mkdir -p "$RUNTIME_DIR/grammars" "$RUNTIME_DIR/queries/datastar"
echo "Compiling parser..."
"${COMPILER[@]}" "${FLAGS[@]}" -shared -fPIC -I"$SCRIPT_DIR/src" \
	"$SCRIPT_DIR/src/parser.c" "$SCRIPT_DIR/src/scanner.c" -o "$RUNTIME_DIR/grammars/datastar.so"
cp "$SCRIPT_DIR/queries/highlights-helix.scm" "$RUNTIME_DIR/queries/datastar/highlights.scm"

if $INSTALL_HTML; then
	mkdir -p "$(dirname "$HTML_QUERY")"
	cp "$HTML_SOURCE" "$HTML_QUERY"
else
	echo "For HTML injections, rerun with --html or merge $HTML_SOURCE into $HTML_QUERY."
fi

printf 'Done. Add to %s/languages.toml:\n\n' "$CONFIG_DIR"
printf '[[language]]\nname = "datastar"\nscope = "source.datastar"\nfile-types = []\n\n'
printf '[[grammar]]\nname = "datastar"\nsource = { path = "%s" }\n' "$SCRIPT_DIR"
