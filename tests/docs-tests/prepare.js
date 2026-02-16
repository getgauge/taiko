const chai = require("chai");
// const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const fs = require("node:fs");
const util = require("node:util");
const path = require("node:path");
const { jsDocToJson } = require("../../packages/taiko/lib/documentation");
const _ncp = require("ncp").ncp;
_ncp.limit = 16;
const recursiveCp = util.promisify(_ncp);
const mkdir = util.promisify(fs.mkdir);

async function prepare() {
  try {
    const docsConstants = prepareDocsConstants();
    await prepareDocsDirs(docsConstants);
    const jsonConstants = prepareJsonConstants(["./jsdoc-inputs/*.js"]);
    await prepareJson(jsonConstants);
  } catch (e) {
    console.error(e);
  }
}

function prepareDocsConstants() {
  const destBaseDir = "./tmp/docs";
  const srcBaseDir = "../../packages/taiko/docs";
  const docsConstants = {
    srcApiDir: path.join(srcBaseDir, "api"),
    destApiDir: path.join(destBaseDir, "api"),
    apiNjkFileName: "api.njk",
    srcIncludesDir: path.join(srcBaseDir, "_includes"),
    destIncludesDir: path.join(destBaseDir, "_includes"),
    srcDataDir: path.join(srcBaseDir, "_data"),
    destDataDir: path.join(destBaseDir, "_data"),
    apiJsFileName: "apis.js",
  };
  return docsConstants;
}

async function prepareDocsDirs({
  destApiDir,
  srcApiDir,
  apiNjkFileName,
  srcIncludesDir,
  destIncludesDir,
  destDataDir,
  srcDataDir,
  apiJsFileName,
}) {
  await prepareNjkDir(srcApiDir, destApiDir, apiNjkFileName);
  await prepareIncludesDir(srcIncludesDir, destIncludesDir);
  await prepareDataDir(srcDataDir, destDataDir, apiJsFileName);
}

async function prepareIncludesDir(srcIncludesDir, destIncludesDir) {
  await recursiveCp(srcIncludesDir, destIncludesDir);
}

async function prepareNjkDir(srcApiDir, destApiDir, apiNjkFileName) {
  await mkdir(destApiDir, { recursive: true });
  await util.promisify(fs.copyFile)(
    path.join(srcApiDir, apiNjkFileName),
    path.join(destApiDir, apiNjkFileName),
  );
}

async function prepareDataDir(srcDataDir, destDataDir, apiJsFileName) {
  await mkdir(destDataDir, { recursive: true });
  await util.promisify(fs.copyFile)(
    path.join(srcDataDir, apiJsFileName),
    path.join(destDataDir, apiJsFileName),
  );
}

function prepareJsonConstants(sourceCodeFiles) {
  const jsonDir = path.join(process.cwd(), "lib");
  const jsonFileName = "api.json";
  const jsonConstants = { sourceCodeFiles, jsonDir, jsonFileName };
  return jsonConstants;
}

async function prepareJson({ sourceCodeFiles, jsonDir, jsonFileName }) {
  await mkdir(jsonDir, { recursive: true });
  const outputFile = path.join(jsonDir, jsonFileName);
  await jsDocToJson(sourceCodeFiles, outputFile);
}

prepare();