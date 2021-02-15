module.exports = function(eleventyConfig) {
    let markdownIt = require("markdown-it");
    let options = {
      html: true
    };
    let markdownLib = markdownIt(options).use(require('markdown-it-task-checkbox'));
    
    eleventyConfig.setLibrary("md", markdownLib);
  };