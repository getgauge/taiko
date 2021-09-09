const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const childProcess = require('child_process');
const { setBrowserOptions, defaultConfig } = require('./config');
const { eventHandler } = require('./eventBus');
const util = require('util');
const mkdtempAsync = util.promisify(fs.mkdtemp);
const writeFileAsync = util.promisify(fs.writeFile);
let temporaryUserDataDir, browserProcess;

function updateArgsFromOptions(args, options) {
  args = options.args ? args.concat(options.args) : args;
  args = process.env.TAIKO_BROWSER_ARGS
    ? args.concat(
        process.env.TAIKO_BROWSER_ARGS.split(/\s*,?\s*--/)
          .filter((arg) => arg !== '')
          .map((arg) => `--${arg}`),
      )
    : args;
  return args;
}

function setHeadlessArgs(args, options) {
  if (options.headless) {
    args.push('--headless');
    if (!args.some((arg) => arg.startsWith('--window-size'))) {
      args.push('--window-size=1440,900');
    }
  }
}

async function setChromeBrowserArgs(options) {
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
    '--no-first-run',
    'about:blank',
  ];
  args = updateArgsFromOptions(args, options);
  if (!args.some((arg) => arg.startsWith('--user-data-dir'))) {
    const os = require('os');
    const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'taiko_dev_profile-');
    temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);
    args.push(`--user-data-dir=${temporaryUserDataDir}`);
  }
  setHeadlessArgs(args, options);
  return args;
}

function errorMessageForBrowserProcessCrash() {
  let message;
  if (!hasBrowserProcessKilled()) {
    return;
  }
  if (browserProcess.exitCode === 0) {
    throw new Error(
      'The Browser instance was closed either via `closeBrowser()` call, or it exited for reasons unknown to Taiko. You can try launching a fresh instance using `openBrowser()` or inspect the logs for details of the possible crash.',
    );
  }
  if (browserProcess.exitCode === null) {
    message = `Browser process with pid ${browserProcess.pid} exited with signal ${browserProcess.signalCode}.`;
  } else {
    message = `Browser process with pid ${browserProcess.pid} exited with status code ${browserProcess.exitCode}.`;
  }
  return message;
}

const browserExitEventHandler = () => {
  browserProcess.killed = true;
  eventHandler.emit('browserCrashed', new Error(errorMessageForBrowserProcessCrash()));
};

function hasBrowserProcessKilled() {
  return browserProcess && browserProcess.killed;
}

const launchBrowser = async (options) => {
  if (browserProcess && !browserProcess.killed) {
    throw new Error('openBrowser cannot be called again as there is a browser instance open.');
  }
  const BrowserFetcher = require('./browserFetcher');
  const browserFetcher = new BrowserFetcher();
  const browserExecutable = browserFetcher.getExecutablePath();
  options = setBrowserOptions(options);
  let args = await setChromeBrowserArgs(options);
  browserProcess = await childProcess.spawn(browserExecutable, args);
  if (options.dumpio) {
    browserProcess.stderr.pipe(process.stderr);
    browserProcess.stdout.pipe(process.stdout);
  }
  browserProcess.once('exit', browserExitEventHandler);
  const endpoint = await browserFetcher.waitForWSEndpoint(
    browserProcess,
    defaultConfig.navigationTimeout,
  );
  return {
    currentHost: endpoint.host,
    currentPort: endpoint.port,
    browserDebugUrl: endpoint.browser,
  };
};

const closeBrowser = async () => {
  let timeout;
  const waitForBrowserToClose = new Promise((fulfill) => {
    browserProcess.removeAllListeners();
    browserProcess.once('exit', () => {
      fulfill();
    });
    if (browserProcess.killed) {
      fulfill();
    }
    timeout = setTimeout(() => {
      fulfill();
      browserProcess.removeAllListeners();
      browserProcess.kill('SIGKILL');
    }, defaultConfig.retryTimeout);
  });
  browserProcess.kill('SIGTERM');
  await waitForBrowserToClose;
  clearTimeout(timeout);
  if (temporaryUserDataDir) {
    try {
      fs.removeSync(temporaryUserDataDir);
    } catch (e) {}
  }
};

module.exports = {
  launchBrowser,
  closeBrowser,
  errorMessageForBrowserProcessCrash,
};
