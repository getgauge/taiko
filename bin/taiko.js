#! /usr/bin/env node

const path = require('path');
const util = require('util');
const fs = require('fs');
const program = require('commander');
const taiko = require('../lib/taiko');
const repl = require('../lib/repl');
const { removeQuotes, symbols, isTaikoRunner } = require('../lib/util');
const devices = require('../lib/device').default;
let repl_mode = false;

function printVersion() {
    const packageJson = require('../package.json');
    return `Version: ${packageJson.version} (Chromium: ${packageJson.taiko.chromium_version})`;
}

async function exitOnUnhandledFailures(e) {
    if (!repl_mode) {
        console.error(e);
        if (await taiko.client()) await taiko.closeBrowser();
        process.exit(1);
    }
}

process.on('unhandledRejection', exitOnUnhandledFailures);
process.on('uncaughtException', exitOnUnhandledFailures);

function runFile(file, observe, observeTime) {
    const realFuncs = {};
    for (let func in taiko) {
        realFuncs[func] = taiko[func];
        if (realFuncs[func].constructor.name === 'AsyncFunction') global[func] = async function () {
            let res, args = arguments;
            if (func === 'openBrowser' && observe) {
                if (args['0']) { args['0'].headless = false; args[0].observe = true; args['0'].observeTime = observeTime; }
                else args = [{ headless: false, observe: true, observeTime: observeTime }];
            }
            res = await realFuncs[func].apply(this, args);
            if (res.description) {
                res.description = symbols.pass + res.description;
                console.log(removeQuotes(util.inspect(res.description, { colors: true }), res.description));
            }
            return res;
        };
        else global[func] = function () {
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

function setupEmulateDevice(device) {
    if (devices.hasOwnProperty(device))
        process.env['TAIKO_EMULATE_DEVICE'] = device;
    else {
        console.log(`Invalid value ${device} for --emulate-device`);
        console.log(`Available devices ${Object.keys(devices).join(', ')}`);
        process.exit(1);
    }
}
program
    .version(printVersion(), '-v, --version')
    .usage(`<file> [options]
       taiko [options]`)
    .option(
        '-o, --observe [observeTime]',
        'enables headful mode and runs script with 3000ms delay by default\n\t\t\t\toptionally takes observeTime in millisecond eg: --observe 5000',
        parseInt, false
    )
    .option(
        '--slow-mod [observeTime]',
        'similar to --observe option'
    )
    .option('--emulate-device <device>', 'Allows to simulate device viewport. Visit https://github.com/getgauge/taiko/blob/master/lib/device.js for all the available options', setupEmulateDevice)
    .action(function () {
        if (!isTaikoRunner(program.rawArgs[1])) {
            module.exports = taiko;
        } else if (program.args.length) {
            const fileName = program.args[0];
            validate(fileName);
            const observe = (program.observe || program['slow-mo'] || program.watch);
            let observeTime = typeof observe === 'number' ? observe : 3000;
            runFile(fileName, Boolean(observe), observeTime);
        } else {
            repl_mode = true;
            repl.initiaize();
        }
    });
program.unknownOption = (option) => {
    console.error('error: unknown option `%s', option);
    program.outputHelp();
    process.exit(1);
};
program.parse(process.argv);