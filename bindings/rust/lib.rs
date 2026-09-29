//! This crate provides Datastar language support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [LANGUAGE][] constant to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! let code = "$count++; @post('/save')";
//! let mut parser = tree_sitter::Parser::new();
//! let language = tree_sitter_datastar::LANGUAGE;
//! parser
//!     .set_language(&language.into())
//!     .expect("Error loading Datastar parser");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! ```
//!
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_datastar() -> *const ();
}

/// The tree-sitter [`LanguageFn`][LanguageFn] for this grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_datastar) };

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers/6-static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Datastar parser");
    }

    #[test]
    fn expressions_require_statement_separators() {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&super::LANGUAGE.into()).unwrap();
        for source in ["", "  \n", "$count++; @post('/save');"] {
            assert!(
                !parser.parse(source, None).unwrap().root_node().has_error(),
                "{source}"
            );
        }
        for source in [
            "$count++ @post('/save')",
            "$count++\n@post('/save')",
            "$foo = ;",
            "letter,, row in $$letters",
        ] {
            assert!(
                parser.parse(source, None).unwrap().root_node().has_error(),
                "{source}"
            );
        }
    }

    #[test]
    fn statement_sequences_are_flat() {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&super::LANGUAGE.into()).unwrap();
        let source = "$count++; ".repeat(200);
        let tree = parser.parse(&source, None).unwrap();
        assert!(!tree.root_node().has_error());
        assert_eq!(tree.root_node().kind(), "program");
        assert_eq!(tree.root_node().named_child_count(), 200);
    }

    #[test]
    fn attribute_keys_stop_at_modifier_delimiters() {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&super::LANGUAGE.into()).unwrap();
        for (source, key) in [
            ("data-bind:_", "_"),
            ("data-signals:_foo_bar.baz__ifmissing", "_foo_bar.baz"),
            ("data-signals:foo_", "foo_"),
            ("data-on:click__window__debounce.500ms", "click"),
        ] {
            let tree = parser.parse(source, None).unwrap();
            assert!(!tree.root_node().has_error(), "{source}");
            let attribute = tree.root_node().named_child(0).unwrap();
            let parsed_key = attribute.named_child(1).unwrap();
            assert_eq!(parsed_key.kind(), "plugin_key");
            assert_eq!(parsed_key.utf8_text(source.as_bytes()).unwrap(), key);
        }
        for source in [
            "data-on:__window",
            "data-signals:foo___ifmissing",
            "data-on: click",
            "data-on:",
        ] {
            assert!(
                parser.parse(source, None).unwrap().root_node().has_error(),
                "{source}"
            );
        }
    }

    #[test]
    fn datastar_queries_compile() {
        let language = super::LANGUAGE.into();
        for source in [
            include_str!("../../queries/datastar/highlights.scm"),
            include_str!("../../queries/datastar/indents.scm"),
            include_str!("../../queries/datastar/textobjects.scm"),
            include_str!("../../queries/highlights-helix.scm"),
        ] {
            tree_sitter::Query::new(&language, source).unwrap();
        }
    }
}
