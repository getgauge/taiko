const assert = require("node:assert");
const taiko = require("../../lib/taiko");
const util = require("node:util");
const { removeQuotes, symbols } = require("../../lib/util");

(() => {
  try {
    const allFuncs = Object.keys(taiko).filter((item) => item !== "emitter");
    const funcsInMetadata = [].concat
      .apply(["metadata"], Object.values(taiko.metadata))
      .filter((item) => item !== "repl");
    assert.deepEqual(allFuncs.sort(), funcsInMetadata.sort());
    const description = `${symbols.pass}All the exported functions are present in metadata`;
    console.log(
      removeQuotes(util.inspect(description, { colors: true }), description),
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
