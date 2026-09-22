// A deliberately tiny C# syntax highlighter.
// It is not a parser: it just colours comments, strings, numbers,
// keywords and PascalCase identifiers (which are usually types).
(function () {
  var KEYWORDS = [
    "public", "private", "protected", "internal", "static", "readonly", "class",
    "interface", "new", "return", "get", "set", "void", "int", "string", "bool",
    "object", "var", "while", "foreach", "in", "out", "true", "false", "null",
    "this", "using", "if", "else", "try", "finally", "yield", "for", "double"
  ];

  var TOKEN = new RegExp(
    "(\\/\\/[^\\n]*)" +                          // 1 comment
    "|(\\$?\"(?:[^\"\\\\\\n]|\\\\.)*\")" +       // 2 string
    "|(\\b\\d+\\b)" +                            // 3 number
    "|(\\b(?:" + KEYWORDS.join("|") + ")\\b)" +  // 4 keyword
    "|(\\b[A-Z][A-Za-z0-9_]*\\b)",               // 5 type-ish
    "g"
  );

  var CLASSES = [null, "tok-com", "tok-str", "tok-num", "tok-kw", "tok-type"];

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightCSharp(source) {
    var out = "";
    var last = 0;
    var m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(source)) !== null) {
      out += escapeHtml(source.slice(last, m.index));
      for (var g = 1; g < CLASSES.length; g++) {
        if (m[g] !== undefined) {
          out += '<span class="' + CLASSES[g] + '">' + escapeHtml(m[g]) + "</span>";
          break;
        }
      }
      last = TOKEN.lastIndex;
    }
    return out + escapeHtml(source.slice(last));
  }

  window.highlightCSharp = highlightCSharp;
  window.escapeHtml = escapeHtml;
})();
