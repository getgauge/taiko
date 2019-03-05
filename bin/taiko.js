#! /usr/bin/env node

const runFile = require('./runFile');
const fs = require('fs');
const program = require('commander');
const taiko = require('../lib/taiko');
const repl = require('../lib/repl');
const { isTaikoRunner } = require('../lib/util');
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
        console.log(`Available devices: ${Object.keys(devices).join(', ')}`);
        process.exit(1);
    }
}

if(isTaikoRunner(process.argv[1])){
    program
        .version(printVersion(), '-v, --version')
        .usage(`[options]
       taiko <file> [options]`)
        .option(
            '-o, --observe',
            `enables headful mode and runs script with 3000ms delay by default.
        \t\t\tpass --wait-time option to override the default 3000ms\n`
        )
        .option('-w, --wait-time <time in ms>', 'runs script with provided delay\n', parseInt)
        .option(
            '--emulate-device <device>',
            'Allows to simulate device viewport. Visit https://github.com/getgauge/taiko/blob/master/lib/device.js for all the available devices\n',
            setupEmulateDevice
        )
        .action(function () {
            if (program.args.length) {
                const fileName = program.args[0];
                validate(fileName);
                const observe = Boolean(program.observe || program.slowMod );
                runFile(fileName, observe, program.waitTime);
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
} else {
    module.exports = taiko; 
}