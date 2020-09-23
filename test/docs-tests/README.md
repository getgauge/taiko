# Docs-test

This is a way to test the automatice generation of the documentation website.

## How to launch

From the porejct root dir execute:

```
npm run test-docs
```

## How it works

It work in 2 steps:

1. generate a test website
2. test the website using taiko

Currently the test is focused on the Nunjucks `njk` templates.

### Generating the test website

The test command, as the first step, generates a test website by:

- copying the structure from the `docs` dir in the project root and in particular the `njk` files
- running `documentation.js` on the test files in the `inputs` folder to generate an `api.json` file
- running `eleventy.js` on the generated `api.json` file with the copied `njk` files

### Testing the website

Then it runs Taiko tests from the folder `gauge` to verify the generated website.
