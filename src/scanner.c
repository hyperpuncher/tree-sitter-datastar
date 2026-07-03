/**
 * External scanner for tree-sitter-datastar
 * Handles plugin_key tokenization to stop at __ delimiter
 */

#include "tree_sitter/parser.h"
#include <wctype.h>

enum TokenType {
  PLUGIN_KEY,
};

void *tree_sitter_datastar_external_scanner_create() { return NULL; }
void tree_sitter_datastar_external_scanner_destroy(void *p) { (void)p; }
void tree_sitter_datastar_external_scanner_reset(void *p) { (void)p; }
unsigned tree_sitter_datastar_external_scanner_serialize(void *p, char *buffer) {
  (void)p;
  (void)buffer;
  return 0;
}
void tree_sitter_datastar_external_scanner_deserialize(void *p, const char *b, unsigned n) {
  (void)p;
  (void)b;
  (void)n;
}

static inline bool is_plugin_key_char(int32_t c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9') ||
         c == '-' || c == '_' || c == '.';
}

bool tree_sitter_datastar_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;

  if (valid_symbols[PLUGIN_KEY]) {
    if (!is_plugin_key_char(lexer->lookahead)) {
      return false;
    }

    while (is_plugin_key_char(lexer->lookahead)) {
      if (lexer->lookahead == '_') {
        lexer->mark_end(lexer);
        lexer->advance(lexer, false);
        if (lexer->lookahead == '_') {
          lexer->result_symbol = PLUGIN_KEY;
          return true;
        }
        lexer->mark_end(lexer);
        continue;
      }

      lexer->advance(lexer, false);
      lexer->mark_end(lexer);
    }
    lexer->result_symbol = PLUGIN_KEY;
    return true;
  }

  return false;
}
