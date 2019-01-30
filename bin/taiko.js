#! /usr/bin/env node

const path = require('path');
const util = require('util');
const fs = require('fs');
const taiko = require('../lib/taiko');
const repl = require('../lib/repl');
const { removeQuotes, symbols, isTaikoRunner } = require('../lib/util');
const { commandlineArgs } = require('../lib/helper');
const observeAgrv = ['--observe','--slow-mo','--watch','-o'];
const argv = process.argv;
let repl_mode = false;
const commands = {'-h':printHelpText,'--help':printHelpText,'-v':printVersion,'--version':printVersion};

function printHelpText(){
    console.log('Usage: taiko   [script.js] [arguments]\ntaiko script.js --observe 5000\nOptions:\n-v, --version display the version\n-o, --observe Enables headful mode and runs script with 3000ms delay by default,\n              optionally takes observeTime in millisecond eg: --observe 5000\n              Alternatives --slow-mo,--watch');
}

function printVersion(){
    const packageJson = require('../package.json');
    console.log(`Version: ${packageJson.version} (Chromium:${packageJson.taiko.chromium_version})`);
}

async function exitOnUnhandledFailures(e){
    if(!repl_mode){
        console.error(e);
        if(await taiko.client())await taiko.closeBrowser();
        process.exit(1);
    }
}

process.on('unhandledRejection', exitOnUnhandledFailures);
process.on('uncaughtException',exitOnUnhandledFailures);
if(isTaikoRunner(process.argv[1]))
    if (process.argv.length > 2){
        (process.argv[2] in commands) ? commands[process.argv[2]]() : runFile(process.argv[2]);
    }else{
        repl_mode = true;
        repl.initiaize();
    }
else
    module.exports = taiko;    

function runFile(file) {
    validate(file);
    const realFuncs = {};
    if (commandlineArgs().emulateDevice) process.env['TAIKO_EMULATE_DEVICE'] = commandlineArgs().emulateDevice;    
    for (let func in taiko) {
        realFuncs[func] = taiko[func];
        if (realFuncs[func].constructor.name === 'AsyncFunction') global[func] = async function() {
            let res,args = arguments;
            const observe = observeAgrv.filter((val) => argv.includes(val));
            if(func === 'openBrowser' && observe.length){
                const observeTime = isNaN(argv[argv.indexOf(observe[0])+1]) ? 3000 : argv[argv.indexOf(observe[0])+1]; 
                if (args['0']) {args['0'].headless = false; args[0].observe = true; args['0'].observeTime = observeTime;}
                else args = [{headless:false, observe:true, observeTime:observeTime}] ;
            }  
            res = await realFuncs[func].apply(this, args);
            if (res.description) {
                res.description = symbols.pass + res.description;
                console.log(removeQuotes(util.inspect(res.description, { colors: true }), res.description));
            }
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