const parent = require("../../.eleventy");

module.exports = (eleventyConfig) => {
  parent(eleventyConfig);

  return {
    dir: {
      input: "./tmp/docs",
      output: "./tmp/docs/_site",
    },
  };
};
