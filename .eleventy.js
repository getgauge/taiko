const tocPlugin = require('eleventy-plugin-toc');
const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("docs/assets");

  // This filter is used for deriving the chapter names
  // from data in chapters.json
  eleventyConfig.addFilter('heading', function (str) {
    return str.replace(/[_;\\/:*?\"<>|&']/g, " ");
  });

  // Filter for linking to section headers
  // and displaying chapters in a page
  let markdownItAnchor = require("markdown-it-anchor");
  let mdIt = markdownIt({
      html: true,
      linkify: true
    })
    .use(markdownItAnchor, {
      permalink: true,
      permalinkBefore: false,
      permalinkClass: "direct-link",
      permalinkSymbol: "#",
      level: [1, 2]
    });
  eleventyConfig.setLibrary("md", mdIt);
  eleventyConfig.addPlugin(tocPlugin);

  return {
    dir: {
      input: 'docs',
      output: 'docs/_site'
    }
  }
};