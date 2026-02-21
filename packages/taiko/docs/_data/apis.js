const fs = require("node:fs");

module.exports = () => {
  try {
    const apis = { classes: [], functions: [] };
    for (const x of JSON.parse(fs.readFileSync("lib/api.json", "utf-8"))) {
      x.kind === "class" ? apis.classes.push(x) : apis.functions.push(x);
    }
    return apis;
  } catch (_error) {
    throw new Error("Please run `npm run doc:api` to generate api metadata");
  }
};
