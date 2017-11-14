#! /usr/bin/env node

const path = require('path');
const util = require('util');
const fs = require('fs');
const taiko = require('./taiko');
const repl = require('./repl');

if (process.argv.length > 2) runFile(process.argv[2]);
else repl.initiaize();

function runFile(file) {
    validate(file);
    const realFuncs = {};
    for (let func in taiko) {
        realFuncs[func] = taiko[func];
        if (realFuncs[func].constructor.name === 'AsyncFunction') global[func] = async function() {
            const res = await realFuncs[func].apply(this, arguments);
            console.log(removeQuotes(util.inspect(' ✔ ' + res.description, { colors: true }), ' ✔ ' + res.description));
            return res;
        };
        else global[func] = function() {
            return realFuncs[func].apply(this, arguments);
        };
        require.cache[path.join(__dirname, 'taiko.js')].exports[func] = global[func];
    }
    const oldNodeModulesPaths = module.constructor._nodeModulePaths;
    module.constructor._nodeModulePaths = function() {
        const ret = oldNodeModulesPaths.apply(this, arguments);
        ret.push(__dirname);
        return ret;
    };
    require(path.resolve(file).slice(0, -3));
}

function validate(file) {
    if (!file.endsWith('.js')) {
        console.log('Invalid file extension. Only javascript files are accepted.');
        process.exit(1);
    }
    if (!fs.existsSync(file)) {
        console.log('File does not exist.');
        process.exit(1);
    }
}

function removeQuotes(textWithQuotes, textWithoutQuotes) {
    return textWithQuotes.replace(`'${textWithoutQuotes}'`, () => textWithoutQuotes);
}