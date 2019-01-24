const setEmulation = async (emulation) => {
    this._emulation = emulation;
};

const setViewport = async(options) => {
    if (options.height === undefined || options.width === undefined)
        throw new Error('No height and width provided');
    options.mobile = options.mobile || false;
    options.deviceScaleFactor = options.deviceScaleFactor || 1;
    await this._emulation.setDeviceMetricsOverride(options);
};

module.exports = {setViewport, setEmulation};