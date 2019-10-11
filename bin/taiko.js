#! /usr/bin/env node

const runFile = require('./runFile');
const fs = require('fs');
const Command = require('commander').Command;
const repl = require('../lib/repl/repl');
const { isTaikoRunner } = require('../lib/util');
const devices = require('../lib/data/devices').default;
const NETWORK_TYPES = Object.keys(
  require('../lib/data/networkConditions'),
);
const { getExecutablePlugins } = require('../lib/plugins');
const processArgv = process.argv;
let repl_mode = false;
let taiko;
function printVersion() {
  const packageJson = require('../package.json');
  let hash = 'RELEASE';
  if (packageJson._resolved && packageJson._resolved.includes('#'))
    hash = packageJson._resolved.split('#')[1];
  return `Version: ${packageJson.version} (Chromium: ${packageJson.taiko.chromium_version}) ${hash}`;
}

async function exitOnUnhandledFailures(e) {
  if (!repl_mode) {
    console.error(e);
    if (taiko && (await taiko.client())) await taiko.closeBrowser();
    process.exit(1);
  }
}

process.on('unhandledRejection', exitOnUnhandledFailures);
process.on('uncaughtException', exitOnUnhandledFailures);

function validate(file) {
  if (!file.endsWith('.js')) {
    console.log(
      'Invalid file extension. Only javascript files are accepted.',
    );
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.log('File does not exist.');
    process.exit(1);
  }
}

function setupEmulateDevice(device) {
  if (Object.prototype.hasOwnProperty.call(devices, device))
    process.env['TAIKO_EMULATE_DEVICE'] = device;
  else {
    console.log(`Invalid value ${device} for --emulate-device`);
    console.log(
      `Available devices: ${Object.keys(devices).join(', ')}`,
    );
    process.exit(1);
  }
}

function setPluginNameInEnv(pluginName) {
  process.env.TAIKO_PLUGIN = pluginName;
  return pluginName;
}

function setEmulatedNetwork(networkType) {
  if (!NETWORK_TYPES.includes(networkType)) {
    console.log(`Invalid value ${networkType} for --emulate-network`);
    console.log(`Available options: ${NETWORK_TYPES.join(', ')}`);
    process.exit(1);
  }
  process.env.TAIKO_EMULATE_NETWORK = networkType;
}

function setDisableLogout() {
  process.env.TAIKO_DISABLE_LOGOUT = 'true';
}

function seekingForHelp(args) {
  return args.includes('-h') || args.includes('--help');
}

function registerSubcommandForPlugins(program, plugins) {
  Object.keys(plugins).forEach(pluginName => {
    program
      .command(`${pluginName} [options...]`)
      .allowUnknownOption(true)
      .action((options, cmd) => {
        let plugin = require(plugins[cmd.name()]);
        plugin.exec(options);
      });
  });
}

function isCLICommand() {
  return require.main === module;
}

if (isTaikoRunner(processArgv[1])) {
  let plugins = getExecutablePlugins();
  if (
    isCLICommand() &&
    !(
      seekingForHelp(processArgv) ||
      Object.prototype.hasOwnProperty.call(plugins, processArgv[2])
    )
  ) {
    // append taiko sub-command as if the user has executed <taiko taiko script.js or just taiko taiko>
    processArgv.splice(2, 0, 'taiko');
  }
  let program = new Command('taiko');
  program
    .arguments('<cmd> [fileName]')
    .version(printVersion(), '-v, --version')
    .usage(
      `[options]
       taiko <file> [options]`,
    )
    .option(
      '-o, --observe',
      `enables headful mode and runs script with 3000ms delay by default.
        \t\t\tpass --wait-time option to override the default 3000ms\n`,
    )
    .option(
      '-l, --load',
      'run the given file and start the repl to record further steps.\n',
    )
    .option(
      '-w, --wait-time <time in ms>',
      'runs script with provided delay\n',
      parseInt,
    )
    .option(
      '--emulate-device <device>',
      'Allows to simulate device viewport. Visit https://github.com/getgauge/taiko/blob/master/lib/devices.js for all the available devices\n',
      setupEmulateDevice,
    )
    .option(
      '--emulate-network <networkType>',
      `Allow to simulate network. Available options are ${NETWORK_TYPES.join(
        ', ',
      )}`,
      setEmulatedNetwork,
    )
    .option(
      '--plugin <plugin1,plugin2...>',
      'Load the taiko plugin.',
      setPluginNameInEnv,
    )
    .option(
      '--no-log',
      'Disable log output of taiko',
      setDisableLogout,
    )
    .action(function(_, fileName, cmd) {
      taiko = require('../lib/taiko');
      if (fileName) {
        validate(fileName);
        const observe = Boolean(cmd.observe || cmd.slowMod);
        if (cmd.load) {
          runFile(taiko, fileName, true, cmd.waitTime, fileName => {
            return new Promise(resolve => {
              repl_mode = true;
              repl.initialize(taiko, fileName, true).then(r => {
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
          runFile(taiko, fileName, observe, cmd.waitTime);
        }
      } else {
        repl_mode = true;
        repl.initialize(taiko);
      }
    });
  registerSubcommandForPlugins(program, plugins);
  program.unknownOption = option => {
    console.error('error: unknown option `%s', option);
    program.outputHelp();
    process.exit(1);
  };
  program.parse(processArgv);
} else {
  module.exports = require('../lib/taiko');
}
