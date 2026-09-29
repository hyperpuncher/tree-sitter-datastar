from unittest import TestCase

import tree_sitter
import tree_sitter_datastar


class TestLanguage(TestCase):
    def test_can_load_grammar(self):
        try:
            tree_sitter.Language(tree_sitter_datastar.language())
        except Exception:
            self.fail("Error loading Datastar grammar")

    def test_javascript_and_datastar_expressions(self):
        language = tree_sitter.Language(tree_sitter_datastar.language())
        parser = tree_sitter.Parser(language)
        for source in [
            b"$controller = new AbortController(); @get('/endpoint')",
            b"@peek(() => { const value = $foo; return value + 1 })",
            b"`count: ${$$count}`",
            b"$controller?.abort?.()",
        ]:
            with self.subTest(source=source):
                tree = parser.parse(source)
                self.assertFalse(tree.root_node.has_error)
                self.assertEqual(tree.root_node.type, "program")
        self.assertTrue(parser.parse(b"$count++\n@get('/endpoint')").root_node.has_error)
