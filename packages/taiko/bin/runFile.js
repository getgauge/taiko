const path = require("node:path");
const util = require("node:util");
const recorder = require("../recorder");

const { removeQuotes } = require("../lib/util");
module.exports = async (taiko, file, observe, observeTime, continueRepl) => {
  const realFuncs = {};
  for (const func in taiko) {
    realFuncs[func] = taiko[func];
    if (realFuncs[func].constructor.name === "AsyncFunction") {
      global[func] = async function () {
        // biome-ignore lint/complexity/noArguments: Cannot use rest parameters
        let args = arguments;
        if (func === "openBrowser" && (observe || continueRepl)) {
          if (args["0"]) {
            args["0"].headless = !observe;
            args[0].observe = observe;
            args["0"].observeTime = observeTime;
          } else if (continueRepl) {
            args = [
              {
                headless: false,
                observe: observe,
                observeTime: observeTime,
              },
            ];
          } else {
            args = [
              {
                headless: !observe,
                observe: observe,
                observeTime: observeTime,
              },
            ];
          }
        }

        const res = await realFuncs[func].apply(this, args);
        return res;
      };
    } else if (realFuncs[func].constructor.name === "Function") {
      global[func] = function () {
        // biome-ignore lint/complexity/noArguments: Cannot use rest parameters
        return realFuncs[func].apply(this, arguments);
      };
    } else {
      global[func] = taiko[func];
    }
    if (continueRepl) {
      recorder.repl = async () => {
        console.log(
          removeQuotes(
            util.inspect("Starting REPL..", { colors: true }),
            "Starting REPL..",
          ),
        );
        await continueRepl(file);
      };
    }
    require.cache[path.join(__dirname, "taiko.js")].exports[func] =
      global[func];
  }
  const oldNodeModulesPaths = module.constructor._nodeModulePaths;
  module.constructor._nodeModulePaths = function () {
    // biome-ignore lint/complexity/noArguments: Cannot use rest parameters
    const ret = oldNodeModulesPaths.apply(this, arguments);
    ret.push(__dirname);
    ret.push(path.dirname(path.dirname(__dirname)));
    return ret;
  };
  require(path.resolve(file).slice(0, -3));
};
