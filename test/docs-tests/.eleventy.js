const parent = require('../../.eleventy')

module.exports = function (eleventyConfig) {

    parent(eleventyConfig);

    return {
      dir: {
        input: './tmp/docs',
        output: './tmp/docs/_site'
      }
    }
  };