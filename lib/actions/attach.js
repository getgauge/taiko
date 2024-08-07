const { isString, isSelector, isElement } = require("../helper");
const FileFieldWrapper = require("../elementWrapper/fileFieldWrapper");
const path = require("node:path");
const fs = require("node:fs");
const {
  description,
  waitAndGetActionableElement,
} = require("./pageActionChecks");
const { defaultConfig } = require("../config");
const domHandler = require("../handlers/domHandler");
const { highlightElement } = require("../elements/elementHelper");

const attach = async (filepaths, to, options) => {
  const filepathsArray =
    typeof filepaths === "string" ? [filepaths] : filepaths;

  const resolvedPaths = filepathsArray.map((filepath) => {
    const resolvedPath = filepath
      ? path.resolve(process.cwd(), filepath)
      : path.resolve(process.cwd());
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File ${resolvedPath} does not exist.`);
    }
    return resolvedPath;
  });

  const targetElement = isString(to)
    ? new FileFieldWrapper(to)
    : isSelector(to) || isElement(to)
      ? to
      : (() => {
          throw Error("Invalid element passed as parameter");
        })();

  const element = await waitAndGetActionableElement(
    targetElement,
    options.force,
  );
  if (defaultConfig.headful) {
    await highlightElement(element);
  }
  await domHandler.setFileInputFiles(element.get(), resolvedPaths);
  return `Attached ${resolvedPaths} to the ${description(targetElement, true)}`;
};

module.exports = { attach };
