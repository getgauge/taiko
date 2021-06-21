const defaultConfig = {
  navigationTimeout: Number(process.env.TAIKO_NAVIGATION_TIMEOUT) || 30000, //Millisecond
  observeTime: 3000, //Millisecond
  retryInterval: 100, //Millisecond
  retryTimeout: Number(process.env.TAIKO_RETRY_TIMEOUT) || 10000, //Millisecond
  noOfElementToMatch: 20,
  observe: false,
  waitForNavigation: true,
  waitForEvents: [],
  ignoreSSLErrors: true,
  headful: false,
  local: process.env.LOCAL_PROTOCOL || false,
  criConnectionRetries: process.env.TAIKO_CRI_CONNECTION_RETRIES || 50,
  firefox:
    (process.env.TAIKO_BROWSER_PATH &&
      process.env.TAIKO_BROWSER_PATH.toLowerCase().includes('firefox')) ||
    false,
  highlightOnAction:
    process.env.TAIKO_BROWSER_PATH &&
    process.env.TAIKO_BROWSER_PATH.toLowerCase().includes('firefox')
      ? 'false'
      : process.env.TAIKO_HIGHLIGHT_ON_ACTION || 'true',
};
const setConfig = (options) => {
  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(defaultConfig, key)) {
      if (typeof defaultConfig[key] !== typeof options[key]) {
        throw new Error(
          `Invalid value for ${key}. Expected ${typeof defaultConfig[
            key
          ]} received ${typeof options[key]}`,
        );
      }
      defaultConfig[key] = options[key];
    } else {
      throw new Error(
        `Invalid config ${key}. Allowed configs are ${Object.keys(defaultConfig).join(', ')}`,
      );
    }
  }
};

const getConfig = (optionName) => {
  if (optionName) {
    if (Object.prototype.hasOwnProperty.call(defaultConfig, optionName)) {
      return defaultConfig[optionName];
    } else {
      throw new Error(
        `Invalid config ${optionName}. Allowed configs are ${Object.keys(defaultConfig).join(
          ', ',
        )}`,
      );
    }
  } else {
    return Object.assign({}, defaultConfig);
  }
};

const setBrowserOptions = (options) => {
  options.port = options.port || 0;
  options.host = options.host || '127.0.0.1';
  options.headless =
    options.headless === undefined || options.headless === null ? true : options.headless;
  const observe = _determineValueFor('observe', options.observe);
  setConfig({
    observeTime: determineObserveDelay(observe, options.observeTime),
    observe: observe,
    ignoreSSLErrors: _determineValueFor('ignoreSSLErrors', options.ignoreCertificateErrors),
    headful: !options.headless,
  });
  return options;
};

const setNavigationOptions = (options) => {
  options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
  options.waitForEvents = options.waitForEvents || defaultConfig.waitForEvents;
  options.navigationTimeout = options.navigationTimeout || defaultConfig.navigationTimeout;
  options.waitForStart = options.waitForStart || 100;
  return options;
};

const setScrollAlignments = (options) => {
  let alignments = {};
  alignments.block = options.alignments.block || 'nearest';
  alignments.inline = options.alignments.inline || 'nearest';
  return alignments;
};

const setClickOptions = (options, x, y) => {
  options = setNavigationOptions(options);
  options.x = x;
  options.y = y;
  options.button = options.button || 'left';
  options.clickCount = options.clickCount || 1;
  options.elementsToMatch = options.elementsToMatch || 10;
  return options;
};

const determineObserveDelay = (shouldObserve, observeTime) => {
  if (shouldObserve) {
    return _determineValueFor('observeTime', observeTime);
  } else {
    return observeTime || 0;
  }
};

const determineWaitForNavigation = (waitForNavigation) => {
  return _determineValueFor('waitForNavigation', waitForNavigation);
};

const determineRetryInterval = (retryInterval) => {
  return _determineValueFor('retryInterval', retryInterval);
};

const determineRetryTimeout = (retryTimeout) => {
  return _determineValueFor('retryTimeout', retryTimeout);
};

const _determineValueFor = (configName, providedValue) => {
  return _hasValue(providedValue) ? providedValue : defaultConfig[configName];
};

const _hasValue = (value) => {
  return !(value === undefined || value === null);
};

module.exports = {
  defaultConfig,
  setConfig,
  getConfig,
  determineWaitForNavigation,
  determineRetryInterval,
  determineRetryTimeout,
  setNavigationOptions,
  setScrollAlignments,
  setClickOptions,
  setBrowserOptions,
};
