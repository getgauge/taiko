# Docs-test

This is a way to test the automatic generation of the documentation website.

## How to launch

From the project root dir run:

```
npm run test-docs
```

## How it works

It work in 2 steps:

1. Generate a test website
2. Test the website using taiko

Currently the test is focused on the Nunjucks `njk` templates.

### Generating the test website

The test command, as the first step, generates a test website by:

- Copying the structure from the `docs` dir in the project root and in particular the `njk` files
- Running `documentation.js` on the test files in the `inputs` folder to generate an `api.json` file
- Running `eleventy.js` on the generated `api.json` file with the copied `njk` files

### Testing the website

Then it runs Taiko tests from the folder `gauge` to verify the generated website.