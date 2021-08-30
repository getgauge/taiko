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

async function setBrowserArgs(options) {
  return defaultConfig.firefox ? setFirefoxBrowserArgs(options) : setChromeBrowserArgs(options);
}

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

async function createProfile(extraPrefs) {
  const profilePath = await mkdtempAsync(path.join(os.tmpdir(), 'taiko_dev_firefox_profile-'));
  const prefsJS = [];
  const userJS = [];
  const server = 'dummy.test';
  const defaultPreferences = {
    // Make sure Shield doesn't hit the network.
    'app.normandy.api_url': '',
    // Disable Firefox old build background check
    'app.update.checkInstallTime': false,
    // Disable automatically upgrading Firefox
    'app.update.disabledForTesting': true,

    // Increase the APZ content response timeout to 1 minute
    'apz.content_response_timeout': 60000,

    // Prevent various error message on the console
    // jest-puppeteer asserts that no error message is emitted by the console
    'browser.contentblocking.features.standard': '-tp,tpPrivate,cookieBehavior0,-cm,-fp',

    // Enable the dump function: which sends messages to the system
    // console
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1543115
    'browser.dom.window.dump.enabled': true,
    // Disable topstories
    'browser.newtabpage.activity-stream.feeds.section.topstories': false,
    // Always display a blank page
    'browser.newtabpage.enabled': false,
    // Background thumbnails in particular cause grief: and disabling
    // thumbnails in general cannot hurt
    'browser.pagethumbnails.capturing_disabled': true,

    // Disable safebrowsing components.
    'browser.safebrowsing.blockedURIs.enabled': false,
    'browser.safebrowsing.downloads.enabled': false,
    'browser.safebrowsing.malware.enabled': false,
    'browser.safebrowsing.passwords.enabled': false,
    'browser.safebrowsing.phishing.enabled': false,

    // Disable updates to search engines.
    'browser.search.update': false,
    // Do not restore the last open set of tabs if the browser has crashed
    'browser.sessionstore.resume_from_crash': false,
    // Skip check for default browser on startup
    'browser.shell.checkDefaultBrowser': false,

    // Disable newtabpage
    'browser.startup.homepage': 'about:blank',
    // Do not redirect user when a milstone upgrade of Firefox is detected
    'browser.startup.homepage_override.mstone': 'ignore',
    // Start with a blank page about:blank
    'browser.startup.page': 0,

    // Do not allow background tabs to be zombified on Android: otherwise for
    // tests that open additional tabs: the test harness tab itself might get
    // unloaded
    'browser.tabs.disableBackgroundZombification': false,
    // Do not warn when closing all other open tabs
    'browser.tabs.warnOnCloseOtherTabs': false,
    // Do not warn when multiple tabs will be opened
    'browser.tabs.warnOnOpen': false,

    // Disable the UI tour.
    'browser.uitour.enabled': false,
    // Turn off search suggestions in the location bar so as not to trigger
    // network connections.
    'browser.urlbar.suggest.searches': false,
    // Disable first run splash page on Windows 10
    'browser.usedOnWindows10.introURL': '',
    // Do not warn on quitting Firefox
    'browser.warnOnQuit': false,

    // Do not show datareporting policy notifications which can
    // interfere with tests
    'datareporting.healthreport.about.reportUrl': `http://${server}/dummy/abouthealthreport/`,
    'datareporting.healthreport.documentServerURI': `http://${server}/dummy/healthreport/`,
    'datareporting.healthreport.logging.consoleEnabled': false,
    'datareporting.healthreport.service.enabled': false,
    'datareporting.healthreport.service.firstRun': false,
    'datareporting.healthreport.uploadEnabled': false,
    'datareporting.policy.dataSubmissionEnabled': false,
    'datareporting.policy.dataSubmissionPolicyAccepted': false,
    'datareporting.policy.dataSubmissionPolicyBypassNotification': true,

    // DevTools JSONViewer sometimes fails to load dependencies with its require.js.
    // This doesn't affect Puppeteer but spams console (Bug 1424372)
    'devtools.jsonview.enabled': false,

    // Disable popup-blocker
    'dom.disable_open_during_load': false,

    // Enable the support for File object creation in the content process
    // Required for |Page.setFileInputFiles| protocol method.
    'dom.file.createInChild': true,

    // Disable the ProcessHangMonitor
    'dom.ipc.reportProcessHangs': false,

    // Disable slow script dialogues
    'dom.max_chrome_script_run_time': 0,
    'dom.max_script_run_time': 0,

    // Only load extensions from the application and user profile
    // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
    'extensions.autoDisableScopes': 0,
    'extensions.enabledScopes': 5,

    // Disable metadata caching for installed add-ons by default
    'extensions.getAddons.cache.enabled': false,

    // Disable installing any distribution extensions or add-ons.
    'extensions.installDistroAddons': false,

    // Disabled screenshots extension
    'extensions.screenshots.disabled': true,

    // Turn off extension updates so they do not bother tests
    'extensions.update.enabled': false,

    // Turn off extension updates so they do not bother tests
    'extensions.update.notifyUser': false,

    // Make sure opening about:addons will not hit the network
    'extensions.webservice.discoverURL': `http://${server}/dummy/discoveryURL`,

    // Allow the application to have focus even it runs in the background
    'focusmanager.testmode': true,
    // Disable useragent updates
    'general.useragent.updates.enabled': false,
    // Always use network provider for geolocation tests so we bypass the
    // macOS dialog raised by the corelocation provider
    'geo.provider.testing': true,
    // Do not scan Wifi
    'geo.wifi.scan': false,
    // No hang monitor
    'hangmonitor.timeout': 0,
    // Show chrome errors and warnings in the error console
    'javascript.options.showInConsole': true,

    // Disable download and usage of OpenH264: and Widevine plugins
    'media.gmp-manager.updateEnabled': false,
    // Prevent various error message on the console
    // jest-puppeteer asserts that no error message is emitted by the console
    'network.cookie.cookieBehavior': 0,

    // Do not prompt for temporary redirects
    'network.http.prompt-temp-redirect': false,

    // Disable speculative connections so they are not reported as leaking
    // when they are hanging around
    'network.http.speculative-parallel-limit': 0,

    // Do not automatically switch between offline and online
    'network.manage-offline-status': false,

    // Make sure SNTP requests do not hit the network
    'network.sntp.pools': server,

    // Disable Flash.
    'plugin.state.flash': 0,

    'privacy.trackingprotection.enabled': false,

    // Enable Remote Agent
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1544393
    'remote.enabled': true,

    // Don't do network connections for mitm priming
    'security.certerrors.mitm.priming.enabled': false,
    // Local documents have access to all other local documents,
    // including directory listings
    'security.fileuri.strict_origin_policy': false,
    // Do not wait for the notification button security delay
    'security.notification_enable_delay': 0,

    // Ensure blocklist updates do not hit the network
    'services.settings.server': `http://${server}/dummy/blocklist/`,

    // Do not automatically fill sign-in forms with known usernames and
    // passwords
    'signon.autofillForms': false,
    // Disable password capture, so that tests that include forms are not
    // influenced by the presence of the persistent doorhanger notification
    'signon.rememberSignons': false,

    // Disable first-run welcome page
    'startup.homepage_welcome_url': 'about:blank',

    // Disable first-run welcome page
    'startup.homepage_welcome_url.additional': '',

    // Disable browser animations (tabs, fullscreen, sliding alerts)
    'toolkit.cosmeticAnimations.enabled': false,

    // We want to collect telemetry, but we don't want to send in the results
    'toolkit.telemetry.server': `https://${server}/dummy/telemetry/`,
    // Prevent starting into safe mode after application crashes
    'toolkit.startup.max_resumed_crashes': -1,
  };

  Object.assign(defaultPreferences, extraPrefs);
  for (const [key, value] of Object.entries(defaultPreferences)) {
    userJS.push(`user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
  }
  await writeFileAsync(path.join(profilePath, 'user.js'), userJS.join('\n'));
  await writeFileAsync(path.join(profilePath, 'prefs.js'), prefsJS.join('\n'));
  return profilePath;
}

async function setFirefoxBrowserArgs(options) {
  let args = ['--no-remote', '--foreground', 'about:blank', '--remote-debugging-port=0'];
  args = updateArgsFromOptions(args, options);
  setHeadlessArgs(args, options);
  if (!args.includes('-profile') && !args.includes('--profile')) {
    temporaryUserDataDir = await createProfile(options.extraPrefsFirefox);
    args.push('--profile');
    args.push(temporaryUserDataDir);
  }
  return args;
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
  let args = await setBrowserArgs(options);
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
