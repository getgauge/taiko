let emulation;

const setEmulation = async (e) => {
    emulation = e;
};

const setViewport = async(options) => {
    if (options.height === undefined || options.width === undefined)
        throw new Error('No height and width provided');
    options.mobile = options.mobile || false;
    options.deviceScaleFactor = options.deviceScaleFactor || 1;
    await emulation.setDeviceMetricsOverride(options);
};

const setLocation = async(options) => {
    const { longitude, latitude, accuracy = 0} = options;
    console.log(longitude);
    if (longitude < -180 || longitude > 180)
        throw new Error(`Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`);
    if (latitude < -90 || latitude > 90)
        throw new Error(`Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`);
    if (accuracy < 0)
        throw new Error(`Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`);
    await emulation.setGeolocationOverride({longitude, latitude, accuracy}).catch((err) =>{
        throw new Error(err);
    });
};

module.exports = { setEmulation, setLocation, setViewport };
