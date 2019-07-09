const config = {
    navigationTimeout: 30000, //Millisecond
    observeTime: 3000, //Millisecond
    retryInterval: 100, //Millisecond
    retryTimeout: 10000, //Millisecond
    observe: false,
    waitForNavigation: true,
    ignoreSSLErrors: false,
    headful: false
};


const setConfig = (options) => {
    for (const key in options) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            if (typeof config[key] !== typeof options[key])
                throw new Error(`Invalid value for ${key}. Expected ${typeof config[key]} received ${typeof options[key]}`);
            config[key] = options[key];
        }
        else {
            throw new Error(`Invalid config ${key}. Allowed configs are ${Object.keys(config).join(', ')}`);
        }
    }
};

const setBrowserOptions = (options) => {
    options.port = options.port || 0;
    options.host = options.host || '127.0.0.1';
    options.headless = options.headless === undefined || options.headless === null ? true : options.headless;
    const observe = options.observe || config.observe;
    setConfig({ 
        observeTime: determineObserveDelay(observe, options.observeTime), 
        observe:observe, 
        ignoreSSLErrors: options.ignoreCertificateErrors || config.ignoreSSLErrors, 
        headful: !options.headless
    });
    return options;
};

const setNavigationOptions = (options) => {
    if (Object.prototype.hasOwnProperty.call(options, 'timeout'))
        console.warn('DEPRECATION WARNING: timeout option is deprecated, use navigationTimeout instead');
    options.waitForNavigation = determineWaitForNavigation(options.waitForNavigation);
    options.navigationTimeout = options.navigationTimeout || options.timeout || config.navigationTimeout;
    options.waitForStart = options.waitForStart || 100;
    return options;
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
        return observeTime || config.observeTime;
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
    return _hasValue(providedValue) ? providedValue : config[configName];
};

const _hasValue = (value) => {
    return !(value === undefined || value === null);
};

module.exports = {
    config,
    setConfig,
    determineWaitForNavigation,
    determineRetryInterval,
    determineRetryTimeout,
    setNavigationOptions,
    setClickOptions,
    setBrowserOptions
};