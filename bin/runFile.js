const path = require('path');
const util = require('util');
const taiko = require('../lib/taiko');
const { removeQuotes, symbols } = require('../lib/util');
module.exports = (file, observe, observeTime) => {
    const realFuncs = {};
    for (let func in taiko) {
        realFuncs[func] = taiko[func];
        if (realFuncs[func].constructor.name === 'AsyncFunction')
            global[func] = async function () {
                let res, args = arguments;
                if (func === 'openBrowser') {
                    if (args['0']) {
                        args['0'].headless = !observe;
                        args[0].observe = observe;
                        args['0'].observeTime = observeTime;
                    }
                    else
                        args = [{ headless: !observe, observe: observe, observeTime: observeTime }];
                }
                res = await realFuncs[func].apply(this, args);
                if (res.description) {
                    res.description = symbols.pass + res.description;
                    console.log(removeQuotes(util.inspect(res.description, { colors: true }), res.description));
                }
                return res;
            };
        else
            global[func] = function () {
                return realFuncs[func].apply(this, arguments);
            };
        require.cache[path.join(__dirname, 'taiko.js')].exports[func] = global[func];
    }
    const oldNodeModulesPaths = module.constructor._nodeModulePaths;
    module.constructor._nodeModulePaths = function () {
        const ret = oldNodeModulesPaths.apply(this, arguments);
        ret.push(__dirname);
        return ret;
    };
    require(path.resolve(file).slice(0, -3));
};