const path = require('path');
const fs = require('fs-extra');
const childProcess = require('child_process');
const { setBrowserOptions, defaultConfig } = require('./config');
const { eventHandler } = require('./eventBus');
let temporaryUserDataDir, chromeProcess;

async function setBrowserArgs(options) {
  let args = [
    `--remote-debugging-port=${options.port}`,
    '--disable-features=site-per-process,TranslateUI',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-background-timer-throttling',
    '--disable-background-networking',
    '--disable-breakpad',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--safebrowsing-disable-auto-update',
    '--password-store=basic',
    '--use-mock-keychain',
    '--enable-automation',
    '--disable-notifications',
    'about:blank',
  ];
  args = options.args ? args.concat(options.args) : args;
  args = process.env.TAIKO_BROWSER_ARGS
    ? args.concat(
        process.env.TAIKO_BROWSER_ARGS.split(/\s*,?\s*--/)
          .filter((arg) => arg !== '')
          .map((arg) => `--${arg}`),
      )
    : args;
  if (!args.some((arg) => arg.startsWith('--user-data-dir'))) {
    const os = require('os');
    const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'taiko_dev_profile-');
    temporaryUserDataDir = await fs.mkdtemp(CHROME_PROFILE_PATH);
    args.push(`--user-data-dir=${temporaryUserDataDir}`);
  }
  if (options.headless) {
    args.push('--headless');
    if (!args.some((arg) => arg.startsWith('--window-size'))) {
      args.push('--window-size=1440,900');
    }
  }
  return args;
}

function errorMessageForChromeProcessCrash() {
  let message;
  if (!hasChromeProcessKilled()) {
    return;
  }
  if (chromeProcess.exitCode === 0) {
    throw new Error(
      'The Browser instance was closed either via `closeBrowser()` call, or it exited for reasons unknown to Taiko. You can try launching a fresh instance using `openBrowser()` or inspect the logs for details of the possible crash.',
    );
  }
  if (chromeProcess.exitCode === null) {
    message = `Chrome process with pid ${chromeProcess.pid} exited with signal ${chromeProcess.signalCode}.`;
  } else {
    message = `Chrome process with pid ${chromeProcess.pid} exited with status code ${chromeProcess.exitCode}.`;
  }
  return message;
}

const browserExitEventHandler = () => {
  chromeProcess.killed = true;
  eventHandler.emit('browserCrashed', new Error(errorMessageForChromeProcessCrash()));
};

function hasChromeProcessKilled() {
  return chromeProcess && chromeProcess.killed;
}

const launchChrome = async (options) => {
  if (chromeProcess && !chromeProcess.killed) {
    throw new Error('OpenBrowser cannot be called again as there is a chromium instance open.');
  }
  const BrowserFetcher = require('./browserFetcher');
  const browserFetcher = new BrowserFetcher();
  const chromeExecutable = browserFetcher.getExecutablePath();
  options = setBrowserOptions(options);
  let args = await setBrowserArgs(options);
  chromeProcess = await childProcess.spawn(chromeExecutable, args);
  if (options.dumpio) {
    chromeProcess.stderr.pipe(process.stderr);
    chromeProcess.stdout.pipe(process.stdout);
  }
  chromeProcess.once('exit', browserExitEventHandler);
  const endpoint = await browserFetcher.waitForWSEndpoint(
    chromeProcess,
    defaultConfig.navigationTimeout,
  );
  return {
    currentHost: endpoint.host,
    currentPort: endpoint.port,
    browserDebugUrl: endpoint.browser,
  };
};

const closeChrome = async () => {
  let timeout;
  const waitForChromeToClose = new Promise((fulfill) => {
    chromeProcess.removeAllListeners();
    chromeProcess.once('exit', () => {
      fulfill();
    });
    if (chromeProcess.killed) {
      fulfill();
    }
    timeout = setTimeout(() => {
      fulfill();
      chromeProcess.removeAllListeners();
      chromeProcess.kill('SIGKILL');
    }, defaultConfig.retryTimeout);
  });
  chromeProcess.kill('SIGTERM');
  await waitForChromeToClose;
  clearTimeout(timeout);
  if (temporaryUserDataDir) {
    try {
      fs.removeSync(temporaryUserDataDir);
    } catch (e) {}
  }
};

module.exports = { launchChrome, closeChrome, errorMessageForChromeProcessCrash };
