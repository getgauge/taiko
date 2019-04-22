const config = {
    navigationTimeout: 30000, //Millisecond
    observeTime: 3000, //Millisecond
    retryInterval: 1000, //Millisecond
    retryTimeout: 10000, //Millisecond

    waitForNavigation: true
};


const setConfig = (options) => {
    for (const key in options) {
        if (config.hasOwnProperty(key)){
            if ( typeof config[key] !== typeof options[key])
                throw new Error(`Invalid value for ${key}. Expected ${typeof config[key]} received ${typeof options[key]}`);
            config[key] = options[key];
        }
        else{
            throw new Error(`Invalid config ${key}. Allowed configs are ${Object.keys(config).join(', ')}`);
        }
    }
};

module.exports = {
    config,
    setConfig
};