const { setConfig, config } = require('../../lib/config');
const originalConfig = Object.assign({}, config);

describe('Config tests', () => {

    describe('For invalid config name', () => {

        test('shoud throw exception', () => {
            let allowedConfig = 'navigationTimeout, observeTime, retryInterval, retryTimeout, waitForNavigation';
            let expectedMessage = `Invalid config invalidConfig. Allowed configs are ${allowedConfig}`;
            expect(() => setConfig({ invalidConfig: true })).toThrowError(new RegExp(`^${expectedMessage}$`));
        });

    });

    describe('For valid config name', () => {

        describe('When valid config value is provided', () => {

            test('should update the config', () => {
                const newConfig = { navigationTimeout: 2, observeTime: 2, retryInterval: 2, retryTimeout: 2, waitForNavigation: false };
                expect(config).not.toEqual(newConfig);

                setConfig(newConfig);
                expect(config).toEqual(newConfig);
            });

        });

        describe('When invalid config value is provided', () => {

            test('should throw error', () => {
                const expectedMessage = new RegExp('Invalid value for navigationTimeout. Expected number received string');
                expect(() => setConfig({ navigationTimeout: 'invalid config value' })).toThrowError(expectedMessage);
            });

        });
    });

    afterEach(() => {
        setConfig(originalConfig);
    });
});
