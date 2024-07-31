const fs = require("fs");

module.exports = () => {
  try {
    var apis = { classes: [], functions: [] };
    JSON.parse(fs.readFileSync("lib/api.json", "utf-8")).forEach((x) =>
      x.kind === "class" ? apis.classes.push(x) : apis.functions.push(x),
    );
    return apis;
  } catch (error) {
    throw new Error("Please run `npm run doc:api` to generate api metadata");
  }
};
