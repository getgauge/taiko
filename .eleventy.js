const tocPlugin = require('eleventy-plugin-toc');
const markdownIt = require('markdown-it');
const CleanCSS = require('clean-css');
const markdownItAnchor = require('markdown-it-anchor');

module.exports = function (eleventyConfig) {
  // Passthrough copy for assets
  eleventyConfig.addPassthroughCopy('docs/assets');

  // CSS minification filter
  eleventyConfig.addFilter('cssmin', function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Heading filter for deriving chapter names
  eleventyConfig.addFilter('heading', function (str) {
    return str.replace(/[_;\\/:*?\"<>|&']/g, ' ');
  });

  // Markdown rendering filter
  const mdIt = markdownIt({
    html: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkBefore: false,
    permalinkClass: 'direct-link',
    permalinkSymbol: '#',
    level: [1, 2],
  });

  eleventyConfig.addFilter('markdown', function (code) {
    return code ? mdIt.render(code) : '';
  });

  // Set Markdown library
  eleventyConfig.setLibrary('md', mdIt);

  // Add TOC plugin
  eleventyConfig.addPlugin(tocPlugin);

  // Configuration for Eleventy
  return {
    dir: {
      input: 'docs',
      output: 'docs/_site',
    },
  };
};
