/**
 * @file Datastar attributes and expressions, extending the JavaScript grammar.
 * @author Yury Kleyman <kleymanyy@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const javascript = require("tree-sitter-javascript/grammar");

module.exports = grammar(javascript, {
  name: "datastar",

  conflicts: ($, original) => [
    ...original,
    [$.primary_expression, $.loop_expression],
    [$.decorator_call_expression, $.action_name],
  ],

  precedences: ($, original) => [...original, ["signal", "member"]],

  rules: {
    program: ($) => choice(repeat1($.datastar_attribute), repeat($.statement), $.loop_expression),

    // Attribute values such as {foo: $bar} are expressions, not labeled blocks.
    expression_statement: ($, original) => prec.dynamic(1, original),

    primary_expression: ($, original) => choice(original, $.signal_reference, $.action_call),
    _lhs_expression: ($, original) => choice(original, $.signal_reference),
    _augmented_assignment_lhs: ($, original) => choice(original, $.signal_reference),

    datastar_attribute: ($) => seq(
      choice("data-", "data-star-"),
      $.plugin_name,
      optional(seq(":", $.plugin_key)),
      repeat(seq("__", $.modifier)),
    ),

    plugin_name: () => choice(
      // Core attributes and CSP configuration.
      "attr", "bind", "class", "computed", "effect", "ignore", "ignore-morph",
      "indicator", "init", "json-signals", "nonce", "on", "on-intersect",
      "on-interval", "on-signal-patch", "on-signal-patch-filter", "preserve-attr",
      "ref", "show", "signals", "style", "text",
      // Pro attributes.
      "animate", "custom-validity", "match-media", "on-raf", "on-resize",
      "persist", "query-string", "replace-url", "scroll-into-view", "view-transition",
      // Rocket structural templates.
      "if", "else-if", "else", "for",
    ),

    // Keep underscores separate so the longer __ delimiter wins lexically.
    plugin_key: () => choice(
      token.immediate("_"),
      seq(
        token.immediate(/_?[a-zA-Z0-9.-]+/),
        repeat(seq(token.immediate("_"), token.immediate(/[a-zA-Z0-9.-]+/))),
        optional(token.immediate("_")),
      ),
    ),

    modifier: ($) => seq($.modifier_name, repeat(seq(".", $.modifier_tag))),
    modifier_name: () => /[a-zA-Z0-9-]+/,
    modifier_tag: () => /[a-zA-Z0-9-]+/,

    // Prefer Datastar prefixes over JavaScript identifiers beginning with $.
    signal_reference: ($) => prec.right("signal", seq(
      choice(token(prec(1, "$")), token(prec(1, "$$"))),
      optional($._property_chain),
    )),
    signal_identifier: () => token.immediate(prec(2, /[a-zA-Z0-9_]+(-[a-zA-Z0-9_]+)*/)),
    _property_chain: ($) => prec.right("signal", seq(
      $.signal_identifier,
      repeat(choice(
        seq(".", $.signal_identifier),
        seq("[", $._expressions, "]"),
      )),
    )),

    action_call: ($) => seq($.action_name, $.arguments),
    action_name: ($) => seq("@", $.identifier),
    loop_expression: ($) => prec.dynamic(2, seq($.identifier, ",", $.identifier, "in", $.expression)),
  },
});
