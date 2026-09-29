package tree_sitter_datastar_test

import (
	"testing"

	tree_sitter_datastar "github.com/hyperpuncher/tree-sitter-datastar/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestDatastarAndJavaScriptExpressions(t *testing.T) {
	parser := tree_sitter.NewParser()
	defer parser.Close()
	if err := parser.SetLanguage(tree_sitter.NewLanguage(tree_sitter_datastar.Language())); err != nil {
		t.Fatal(err)
	}
	for _, source := range []string{
		"$controller = new AbortController(); @get('/endpoint')",
		"@peek(() => { const value = $foo; return value + 1 })",
		"`count: ${$$count}`",
		"$controller?.abort?.()",
	} {
		tree := parser.Parse([]byte(source), nil)
		if tree.RootNode().HasError() {
			t.Errorf("parse failed: %s", source)
		}
		tree.Close()
	}
}

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_datastar.Language())
	if language == nil {
		t.Errorf("Error loading Datastar grammar")
	}
}
