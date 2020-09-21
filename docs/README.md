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

1. it runs [documentation.js](https://documentation.js.org/) to generate a JSON representation of the JSDoc comments
2. it runs [eleventy](https://www.11ty.dev/) to generate the website

#### Step 1 - Generating the JSON

This steps uses the [documentation.js](https://documentation.js.org/)  library to parse the JSDoc comments in the code and generate a JSON file name `lib/api.json`.

The chain is the follwing:

- you digit `npm run doc`
- as a first step this runs `npm run doc:api`
- this launches `lib/documentation.js`
- which checks the env variable `TAIKO_SKIP_DOCUMENTATION`, if false it lanches `npx documentation build --shallow lib/taiko.js lib/elementWrapper/*.js -o lib/api.json`

In other words you can obtaine the same effect if you type in the terminal:
```bash
npx documentation build --shallow lib/taiko.js lib/elementWrapper/*.js -o lib/api.json
```

As you can see, at the timw of writing, only some of the code is parsed:
- `taiko.js` contains the definition of the APIs for external use
- `lib/elementWrapper/*.js` contains the definition of some classes (`ElementWrapper` and company) which are used as return type for api's functions

#### Step 2 - Generating the web site

The second step uses [eleventy](https://www.11ty.dev/)  to generate the web site. There is a `.eleventy.js` file in the project's root dir which configures the tool and in particular sets:

- `input: './docs',`
- `output: './docs/_site'`

Eleventy takes the input folder, which mainly contains `markdown` files and converts everything to `html`.

Addiotionally there is a folder named `docs/api` which contains templates built with [nunjucks](https://mozilla.github.io/nunjucks/):

- `class.njk`
- `api.njk`
- `reference.njk`


Those templates produce website pages based on data provided by two functions:

- `docs/_data/apis.js` which basically reads the the data from `lib/api.json` produced in step 1, and divides them in:
  - classes which are processed with the `class.njk` template
  - functions which are procesed with the `api.njk` template
- `docs/_data/metadata.js` which basically reads the variable `metadata` from `lib/taiko.js`, this variable contains the table of contents for the page _API Reference_ and it is processed with `reference.njk` template

