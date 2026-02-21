const tocPlugin = require("eleventy-plugin-toc");
const markdownIt = require("markdown-it");
const CleanCSS = require("clean-css");

module.exports = (eleventyConfig) => {
  eleventyConfig.addPassthroughCopy("docs/assets");
  eleventyConfig.addFilter(
    "cssmin",
    (code) => new CleanCSS({}).minify(code).styles,
  );
  // This filter is used for deriving the chapter names
  // from data in chapters.json
  eleventyConfig.addFilter("heading", (str) =>
    str.replace(/[_;\\/:*?"<>|&']/g, " "),
  );

  // Filter for linking to section headers
  // and displaying chapters in a page
  const markdownItAnchor = require("markdown-it-anchor");
  const mdIt = markdownIt({
    html: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkBefore: false,
    permalinkClass: "direct-link",
    permalinkSymbol: "#",
    level: [1, 2],
  });
  eleventyConfig.addFilter("markdown", (code) => {
    if (code) {
      return mdIt.render(code);
    }
  });
  eleventyConfig.setLibrary("md", mdIt);
  eleventyConfig.addPlugin(tocPlugin);

  return {
    dir: {
      input: "docs",
      output: "docs/_site",
    },
  };
};
