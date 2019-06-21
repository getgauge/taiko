const expect = require('chai').expect;
const { setConfig, config, determineWaitForNavigation, determineRetryTimeout, determineRetryInterval } = require('../../lib/config');
const originalConfig = Object.assign({}, config);

describe('Config tests', () => {

    describe('Test setConfig', () => {

        describe('For invalid config name', () => {

            it('should throw exception', () => {
                let allowedConfig = 'navigationTimeout, observeTime, retryInterval, retryTimeout, waitForNavigation';
                let expectedMessage = `Invalid config invalidConfig. Allowed configs are ${allowedConfig}`;
                expect(() => setConfig({ invalidConfig: true })).to.throw(new RegExp(`^${expectedMessage}$`));
            });

        });

        describe('For valid config name', () => {

            describe('When valid config value is provided', () => {

                it('should update the config', () => {
                    const newConfig = {
                        navigationTimeout: 2,
                        observeTime: 2,
                        retryInterval: 2,
                        retryTimeout: 2,
                        waitForNavigation: false
                    };
                    expect(config).not.deep.equal(newConfig);

                    setConfig(newConfig);
                    expect(config).to.deep.equal(newConfig);
                });

            });

            describe('When invalid config value is provided', () => {

                it('should throw error', () => {
                    const expectedMessage = new RegExp('Invalid value for navigationTimeout. Expected number received string');
                    expect(() => setConfig({ navigationTimeout: 'invalid config value' })).to.throw(expectedMessage);
                });

            });
        });
    });

    describe('Test determineWaitForNavigation', () => {

        describe('For undefined or null value', () => {

            it('should return default value when provided value is undefined', () => {
                let actualValue = determineWaitForNavigation();
                expect(actualValue).to.be.true;
            });

            it('should return default value when provided value is null', () => {
                let actualValue = determineWaitForNavigation(null);
                expect(actualValue).to.be.true;
            });

        });

        describe('For correct value', () => {

            it('should return provided value', () => {
                let actualValue = determineWaitForNavigation(false);
                expect(actualValue).to.be.false;
            });

        });
    });

    describe('Test determineRetryTimeout', () => {

        describe('For undefined or null value', () => {

            it('should return default value when provided value is undefined', () => {
                let actualValue = determineRetryTimeout();
                expect(actualValue).to.equal(10000);
            });

            it('should return default value when provided value is null', () => {
                let actualValue = determineRetryTimeout(null);
                expect(actualValue).to.equal(10000);
            });

        });

        describe('For correct value', () => {

            it('should return provided value', () => {
                let actualValue = determineRetryTimeout(100);
                expect(actualValue).to.equal(100);
            });

        });

    });

    describe('Test determineRetryInterval', () => {

        describe('For undefined or null value', () => {

            it('should return default value when provided value is undefined', () => {
                let actualValue = determineRetryInterval();
                expect(actualValue).to.equal(100);
            });

            it('should return default value when provided value is null', () => {
                let actualValue = determineRetryInterval(null);
                expect(actualValue).to.equal(100);
            });

        });

        describe('For correct value', () => {

            it('should return provided value', () => {
                let actualValue = determineRetryInterval(1000);
                expect(actualValue).to.equal(1000);
            });

        });

    });

    afterEach(() => {
        setConfig(originalConfig);
    });
});
