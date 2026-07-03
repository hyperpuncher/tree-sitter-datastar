; extends

; Inject datastar into attribute VALUES for expressions
((attribute
  (attribute_name) @_attr
  (quoted_attribute_value
    (attribute_value) @injection.content))
  (#match? @_attr "^data-(attr|bind|class|computed|effect|ignore|ignore-morph|indicator|init|json-signals|on|on-intersect|on-interval|on-signal-patch|on-signal-patch-filter|preserve-attr|ref|show|signals|style|text|animate|custom-validity|match-media|on-raf|on-resize|persist|query-string|replace-url|rocket|scroll-into-view|view-transition|if|else-if|else|for)")
  (#set! injection.language "datastar"))

; Inject datastar into attribute NAMES to parse data-plugin:modifier
((attribute_name) @injection.content
  (#match? @injection.content "^data-(attr|bind|class|computed|effect|ignore|ignore-morph|indicator|init|json-signals|on|on-intersect|on-interval|on-signal-patch|on-signal-patch-filter|preserve-attr|ref|show|signals|style|text|animate|custom-validity|match-media|on-raf|on-resize|persist|query-string|replace-url|rocket|scroll-into-view|view-transition|if|else-if|else|for)")
  (#set! injection.language "datastar")
  (#set! injection.include-children))
