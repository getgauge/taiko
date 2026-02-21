### Building the website

```
npm run doc 
```

### Preview and Develop

```
npm run doc:serve
```


### How the website generation works

When you run `npm run doc` this does two steps:

1. Run [documentation.js](https://documentation.js.org/) to generate a JSON representation of the JSDoc comments
2. Run [eleventy](https://www.11ty.dev/) to generate HTML for the documentation website.

#### Step 1 - Generating the JSON

This steps uses the [documentation.js](https://documentation.js.org/)  library to parse the JSDoc comments in the code and generate a JSON file name `lib/api.json`.

The chain is the following:

- `npm run doc`
- Which runs `npm run doc:api`
- Which launches `lib/documentation.js`
- Which in turn checks the environment variable `TAIKO_SKIP_DOCUMENTATION`, 
if false generates lib/api.json

This is the same as running the following command in the terminal:
```bash
npx documentation build --shallow lib/taiko.js lib/elementWrapper/*.js -o lib/api.json
```

At the time of writing, only JSDoc comments in `taiko.js` and the files in the directory of `elementWrapper` are parsed:
- `taiko.js` contains the definition of the APIs for external use
- `lib/elementWrapper/*.js` contains the definition of some classes (`ElementWrapper` and company) which are used as return type for api's functions

#### Step 2 - Generating the web site

The second step uses [eleventy](https://www.11ty.dev/) to generate the web site. There is a `.eleventy.js` file in the project's root dir which configures the tool and in particular sets:

- `input: './docs',`
- `output: './docs/_site'`

Eleventy takes the input folder, which mainly contains `markdown` files and converts everything to `html`.

Additionally there is a folder named `docs/api` which has templates built with [nunjucks](https://mozilla.github.io/nunjucks/):

- `class.njk`
- `api.njk`
- `reference.njk`


Those templates are converted to HTML from data provided by two functions:

- `docs/_data/apis.js` which basically reads the the data from `lib/api.json` produced in step 1, and divides them in:
  - classes which are processed with the `class.njk` template
  - functions which are procesed with the `api.njk` template
- `docs/_data/metadata.js` which basically reads the variable `metadata` from `lib/taiko.js`, this variable contains the table of contents for the page _API Reference_ and it is processed with `reference.njk` template
