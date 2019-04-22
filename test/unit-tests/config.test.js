const { setConfig, config, determineWaitForNavigation } = require('../../lib/config');
const originalConfig = Object.assign({}, config);

describe('Config tests', () => {

    describe('Test setConfig', () => {

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
                    const newConfig = {
                        navigationTimeout: 2,
                        observeTime: 2,
                        retryInterval: 2,
                        retryTimeout: 2,
                        waitForNavigation: false
                    };
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
    });

    describe('Test deriveNavigationTimeout', () => {

        describe('For undefind or null value', () => {
            test('should return default value when provided value is undefind', () => {
                let actualValue = determineWaitForNavigation();
                expect(actualValue).toBeTruthy();
            });

            test('should return default value when provided value is null', () => {
                let actualValue = determineWaitForNavigation(null);
                expect(actualValue).toBeTruthy();
            });
        });

        describe('For correct value', () => {
            test('should return rovided value', () => {
                let actualValue = determineWaitForNavigation(false);
                expect(actualValue).toBeFalsy();
            });
        });
    });

    afterEach(() => {
        setConfig(originalConfig);
    });
});
