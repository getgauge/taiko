#! /usr/bin/env node

const runFile = require('./runFile');
const fs = require('fs');
const path = require('path');
const program = require('commander');
const { spawnSync } = require('child_process');
const taiko = require('../lib/taiko');
const repl = require('../lib/repl');
const { isTaikoRunner } = require('../lib/util');
const devices = require('../lib/data/devices').default;
let repl_mode = false;
let plugins = new Map();

function printVersion() {
    const packageJson = require('../package.json');
    let paths = [];
    let taikoPath;
    let version;
    try{
        if((__dirname).includes('node_modules')) {
            taikoPath = spawnSync('npm', ['list', 'taiko', '--json']);
            if (!taikoPath.error) paths.push(taikoPath.stdout.toString().trim());
            version = JSON.parse(paths).dependencies.taiko.resolved.split('#')[1];
        } else {
            taikoPath = spawnSync('npm', ['list', 'taiko', '--json', '-g']);
            if (!taikoPath.error) paths.push(taikoPath.stdout.toString().trim());
            version = JSON.parse(paths).dependencies.taiko.resolved.split('#')[1];
        }
    }catch(e) {
        version = 'RELEASE';
    }   
    return `Version: ${packageJson.version} (Chromium: ${
        packageJson.taiko.chromium_version
    }) ${version}`;
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

function getPossibleModulePaths() {
    let paths = [];
    let o = spawnSync('npm', ['root']);
    if (!o.error) paths.push(o.stdout.toString().trim());
    o = spawnSync('npm', ['root', '-g']);
    if (!o.error) paths.push(o.stdout.toString().trim());
    return paths;
}

function loadPlugin(plugin) {
    try {
        let paths = getPossibleModulePaths();
        let location = paths
            .map(p => {
                if (fs.existsSync(path.join(p, plugin))) {
                    return path.join(p, plugin);
                }
            })
            .filter(function(p) {
                return p;
            })[0];
        if (!location) throw new Error(`The plugin ${plugin} is not installed.`);
        let p = require(location);
        taiko.loadPlugin(p.ID, p.clientHandler);
        plugins.set(p.ID, p);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

function loadPlugins(plugins) {
    plugins.split(',').forEach(plugin => {
        loadPlugin(plugin.trim());
    });
}

function isVersion(arg) {
    return arg === '-v' || arg === '--version';
}

if (isTaikoRunner(process.argv[1])) {
    program
        .usage(
            `[options]
       taiko <file> [options]`
        )
        .option('-v, --version', 'prints the version info', printVersion)
        .option(
            '-o, --observe',
            `enables headful mode and runs script with 3000ms delay by default.
        \t\t\tpass --wait-time option to override the default 3000ms\n`
        )
        .option(
            '-l, --load',
            'run the given file and start the repl to record further steps.\n'
        )
        .option(
            '-w, --wait-time <time in ms>',
            'runs script with provided delay\n',
            parseInt
        )
        .option(
            '--emulate-device <device>',
            'Allows to simulate device viewport. Visit https://github.com/getgauge/taiko/blob/master/lib/devices.js for all the available devices\n',
            setupEmulateDevice
        )
        .option(
            '--plugin <plugin1,plugin2...>',
            'Load the taiko plugin.',
            loadPlugins
        )
        .action(function() {
            if(program.rawArgs.some(isVersion)){ 
                console.log(program.version); 
                return; 
            }
            if (program.args.length) {
                const fileName = program.args[0];
                validate(fileName);
                const observe = Boolean(program.observe || program.slowMod);
                if (program.load) {
                    runFile(fileName, true, program.waitTime, fileName => {
                        return new Promise(resolve => {
                            repl_mode = true;
                            repl.initialize(plugins, fileName).then(r => {
                                let listeners = r.listeners('exit');
                                r.removeAllListeners('exit');
                                r.on('exit', () => {
                                    listeners.forEach(l => r.addListener('exit', l));
                                    resolve();
                                });
                            });
                        });
                    });
                } else {
                    runFile(fileName, observe, program.waitTime);
                }
            } else {
                repl_mode = true;
                repl.initialize(plugins);
            }
        });
    program.unknownOption = option => {
        console.error('error: unknown option `%s', option);
        program.outputHelp();
        process.exit(1);
    };
    program.parse(process.argv);
} else {
    module.exports = taiko;
}