const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {

    // Change which Eleventy template formats use syntax highlighters
    templateFormats: ["*"], // default

    // e.g. Use syntax highlighters in njk and md Eleventy templates (not liquid)
    // templateFormats: ["njk", "md"],

    // init callback lets you customize Prism
    init: function({ Prism }) {
    //   const textLanguage = Prism.languages['text'];
    //   Prism.languages.badlang = textLanguage;
    },

    // Added in 3.0, set to true to always wrap lines in `<span class="highlight-line">`
    // The default (false) only wraps when line numbers are passed in.
    alwaysWrapLineHighlights: false,

    // Added in 3.0.2, set to false to opt-out of pre-highlight removal of leading
    // and trailing whitespace
    trim: true,
    
    // Added in 3.0.4, change the separator between lines (you may want "\n")
    lineSeparator: "<br>",
  });
};