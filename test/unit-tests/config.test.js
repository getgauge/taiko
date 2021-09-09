const expect = require('chai').expect;
const rewire = require('rewire');

describe('Config tests', () => {
  let config, originalConfig;
  beforeEach(() => {
    config = rewire('../../lib/config');
    Object.assign({}, config.defaultConfig);
  });
  afterEach(() => {
    config = rewire('../../lib/config');
  });
  describe('Test setConfig', () => {
    describe('For invalid config name', () => {
      it('should throw exception', () => {
        let allowedConfig = Object.keys(config.defaultConfig);
        let allowedConfigString = allowedConfig.join(', ');

        let expectedMessage = `Invalid config invalidConfig. Allowed configs are ${allowedConfigString}`;
        expect(() => config.setConfig({ invalidConfig: true })).to.throw(
          new RegExp(`^${expectedMessage}$`),
        );
      });
    });

    describe('For valid config name', () => {
      describe('When valid config value is provided', () => {
        it('should update the config', () => {
          const newConfig = {
            headful: false,
            highlightOnAction: 'true',
            ignoreSSLErrors: true,
            navigationTimeout: 2,
            observe: false,
            observeTime: 2,
            retryInterval: 2,
            retryTimeout: 2,
            waitForNavigation: false,
            waitForEvents: ['firstContentfulPaint'],
            criConnectionRetries: 50,
            noOfElementToMatch: 20,
            local: false,
            blockAlignment: 'nearest',
            inlineAlignment: 'nearest'
          };
          expect(config.defaultConfig).not.deep.equal(newConfig);

          config.setConfig(newConfig);
          expect(config.defaultConfig).to.deep.equal(newConfig);
        });
      });

      describe('When invalid config value is provided', () => {
        it('should throw error', () => {
          const expectedMessage = new RegExp(
            'Invalid value for navigationTimeout. Expected number received string',
          );
          expect(() =>
            config.setConfig({
              navigationTimeout: 'invalid config value',
            }),
          ).to.throw(expectedMessage);
        });
      });
    });
  });

  describe('Test getConfig', () => {
    describe('For invalid config name', () => {
      it('should throw exception', () => {
        let allowedConfig = Object.keys(config.defaultConfig);
        let allowedConfigString = allowedConfig.join(', ');

        let expectedMessage = `Invalid config invalidConfig. Allowed configs are ${allowedConfigString}`;
        expect(() => config.getConfig('invalidConfig')).to.throw(
          new RegExp(`^${expectedMessage}$`),
        );
      });
    });

    describe('For valid config name', () => {
      it('should return the specified config', () => {
        let allowedConfig = Object.keys(config.defaultConfig);

        allowedConfig.forEach((optionName) => {
          let optionValue = config.getConfig(optionName);
          expect(config.defaultConfig[optionName]).to.equal(optionValue);
        });
      });
    });

    describe('For no config name', () => {
      it('should return the full config', () => {
        expect(config.defaultConfig).to.deep.equal(config.getConfig());
      });
    });
  });

  describe('Test determineWaitForNavigation', () => {
    describe('For undefined or null value', () => {
      it('should return default value when provided value is undefined', () => {
        let actualValue = config.determineWaitForNavigation();
        expect(actualValue).to.be.true;
      });

      it('should return default value when provided value is null', () => {
        let actualValue = config.determineWaitForNavigation(null);
        expect(actualValue).to.be.true;
      });
    });

    describe('For correct value', () => {
      it('should return provided value', () => {
        let actualValue = config.determineWaitForNavigation(false);
        expect(actualValue).to.be.false;
      });
    });
  });

  describe('Test determineRetryTimeout', () => {
    describe('For undefined or null value', () => {
      it('should return default value when provided value is undefined', () => {
        let actualValue = config.determineRetryTimeout();
        expect(actualValue).to.equal(10000);
      });

      it('should return default value when provided value is null', () => {
        let actualValue = config.determineRetryTimeout(null);
        expect(actualValue).to.equal(10000);
      });
    });

    describe('For correct value', () => {
      it('should return provided value', () => {
        let actualValue = config.determineRetryTimeout(100);
        expect(actualValue).to.equal(100);
      });
    });
  });

  describe('Test determineRetryInterval', () => {
    describe('For undefined or null value', () => {
      it('should return default value when provided value is undefined', () => {
        let actualValue = config.determineRetryInterval();
        expect(actualValue).to.equal(100);
      });

      it('should return default value when provided value is null', () => {
        let actualValue = config.determineRetryInterval(null);
        expect(actualValue).to.equal(100);
      });
    });

    describe('For correct value', () => {
      it('should return provided value', () => {
        let actualValue = config.determineRetryInterval(1000);
        expect(actualValue).to.equal(1000);
      });
    });
  });

  describe('Test determineObserveDelay', () => {
    let determineObserveDelay;

    before(() => {
      determineObserveDelay = config.__get__('determineObserveDelay');
    });

    describe('with observe true', () => {
      it('should return provided value', () => {
        let actualValue = determineObserveDelay(true, 5000);
        expect(actualValue).to.equal(5000);
      });

      it('should return default value when provided value is null or undefined', () => {
        let actualValue = determineObserveDelay(true, undefined);
        expect(actualValue).to.equal(3000);
      });
    });

    describe('with observe false', () => {
      it('should return provided value', () => {
        let actualValue = determineObserveDelay(false, 5000);
        expect(actualValue).to.equal(5000);
      });

      it('should return default value when provided value is null or undefined', () => {
        let actualValue = determineObserveDelay(false, undefined);
        expect(actualValue).to.equal(0);
      });
    });
  });

  describe('Test setNavigationOptions', () => {
    it('should return default options', () => {
      const exceptedOptions = {
        navigationTimeout: 30000,
        waitForNavigation: true,
        waitForStart: 100,
        waitForEvents: [],
      };
      const actualOptions = config.setNavigationOptions({});
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });

    it('should return given options', () => {
      const exceptedOptions = {
        navigationTimeout: 60000,
        waitForNavigation: false,
        waitForStart: 500,
        waitForEvents: ['largestContentfulPaint'],
      };
      const actualOptions = config.setNavigationOptions(exceptedOptions);
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });
  });

  describe('Test setBrowserOptions', () => {
    it('should return default options', () => {
      const exceptedOptions = {
        headless: true,
        host: '127.0.0.1',
        port: 0,
      };
      const actualOptions = config.setBrowserOptions({});
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });

    it('should set defaultConfig with given value', () => {
      const options = {
        observe: true,
        observeTime: 5000,
        ignoreCertificateErrors: true,
        headless: false,
      };
      const expectedConfig = {
        headful: true,
        highlightOnAction: 'true',
        ignoreSSLErrors: true,
        navigationTimeout: 30000,
        observe: true,
        observeTime: 5000,
        retryInterval: 100,
        retryTimeout: 10000,
        waitForNavigation: true,
        waitForEvents: [],
        criConnectionRetries: 50,
        noOfElementToMatch: 20,
        local: false,
        blockAlignment: 'nearest',
        inlineAlignment: 'nearest'
      };
      config.setBrowserOptions(options);
      expect(config.defaultConfig).to.deep.equal(expectedConfig);
    });

    it('should return given options', () => {
      const exceptedOptions = {
        headless: false,
        host: '127.0.2.1',
        port: '9222',
      };
      const actualOptions = config.setBrowserOptions(exceptedOptions);
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });
  });

  describe('Test setClickOptions', () => {
    it('should return default options', () => {
      const exceptedOptions = {
        button: 'left',
        clickCount: 1,
        elementsToMatch: 10,
        navigationTimeout: 30000,
        waitForNavigation: true,
        waitForStart: 100,
        waitForEvents: [],
        x: undefined,
        y: undefined,
      };
      const actualOptions = config.setClickOptions({});
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });

    it('should return given options', () => {
      const options = {
        button: 'right',
        clickCount: 3,
        elementsToMatch: 10,
      };
      const exceptedOptions = {
        button: 'right',
        clickCount: 3,
        elementsToMatch: 10,
        navigationTimeout: 30000,
        waitForNavigation: true,
        waitForEvents: [],
        waitForStart: 100,
        x: 32,
        y: 45,
      };
      const actualOptions = config.setClickOptions(options, 32, 45);
      expect(actualOptions).to.deep.equal(exceptedOptions);
    });
  });

  afterEach(() => {
    config.setConfig(originalConfig);
  });
});
