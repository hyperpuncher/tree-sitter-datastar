; Highlighting rules for datastar expressions

; Datastar attribute names - parsed from HTML attribute names
; data-{plugin}[:key][__modifier[.tag]...]
(datastar_attribute
  "data-" @tag.attribute
  (plugin_name) @tag.builtin)

(datastar_attribute
  ":" @punctuation.delimiter
  (plugin_key) @property)

(datastar_attribute
  "__" @punctuation.delimiter
  (modifier
    (modifier_name) @property))

(modifier
  "." @punctuation.delimiter
  (modifier_tag) @property)

(signal_reference) @variable.builtin.datastar

; Action calls - highlight @ and identifier with same color
(action_name "@" @function.builtin.datastar)
(action_name (identifier) @function.builtin.datastar)

; JavaScript operators
["=" "+=" "-=" "*=" "/=" "%=" "**=" "&&=" "||=" "??=" "&=" "|=" "^=" "<<=" ">>=" ">>>="] @operator
["&&" "||" "??" "==" "!=" "===" "!==" "<" ">" "<=" ">=" "in" "instanceof"] @operator
["+" "-" "*" "/" "%" "**" "<<" ">>" ">>>" "&" "|" "^"] @operator
["!" "~" "typeof" "void" "delete" "++" "--"] @operator
["?" ":"] @operator
"..." @operator

; Member access
["." "?." "[" "]" "?.["] @operator

; Literals
(string_literal) @string
(regex_literal) @string.regex
(number_literal) @number  
(boolean_literal) @constant.builtin
(null_literal) @constant.builtin
(undefined_literal) @constant.builtin

; Keywords
["typeof" "void" "delete" "in" "instanceof"] @keyword

(identifier) @variable

; Punctuation
["(" ")" "{" "}" "[" "]" "," ":" ";"] @punctuation.delimiter

; Property keys in objects
(property (identifier) @property)
(property (string_literal) @property)
