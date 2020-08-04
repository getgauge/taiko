const chai = require('chai');
const rewire = require('rewire');
const expect = chai.expect;
const chaiAsPromissed = require('chai-as-promised');
chai.use(chaiAsPromissed);
const test_name = 'Network Handler';

describe(test_name, () => {
  let actualNetworkCondition, networkHandler;

  before(() => {
    networkHandler = rewire('../../../lib/handlers/networkHandler');
    delete process.env.TAIKO_EMULATE_NETWORK;
    let network = {
      requestWillBeSent: () => {},
      loadingFinished: () => {},
      loadingFailed: () => {},
      responseReceived: () => {},
      setCacheDisabled: () => {},
      setRequestInterception: () => {},
      requestIntercepted: () => {},
      emulateNetworkConditions: (networkCondition) => {
        actualNetworkCondition = networkCondition;
        return Promise.resolve();
      },
    };
    networkHandler.__set__('network', network);
  });
  after(() => {
    actualNetworkCondition = {};
    const createdSessionListener = networkHandler.__get__('createdSessionListener');
    networkHandler.__get__('eventHandler').removeListener('createdSession', createdSessionListener);
    networkHandler = rewire('../../../lib/handlers/networkHandler');
    networkHandler.__get__('eventHandler').removeListener('createdSession', createdSessionListener);
    process.env.TAIKO_EMULATE_NETWORK = '';
  });
  describe('setNetworkEmulation', () => {
    it('should invoke emulateNetworkConditions with a correct String option', async () => {
      const expectedNetworkCondition = {
        offline: false,
        downloadThroughput: 6400,
        uploadThroughput: 2560,
        latency: 500,
      };
      await networkHandler.setNetworkEmulation('GPRS');
      expect(actualNetworkCondition).to.deep.equal(expectedNetworkCondition);
    });

    it('should invoke emulateNetworkConditions with a correct Object option', async () => {
      const expectedNetworkCondition = {
        offline: false,
        downloadThroughput: 6400,
        uploadThroughput: 2560,
        latency: 500,
      };
      await networkHandler.setNetworkEmulation(expectedNetworkCondition);
      expect(actualNetworkCondition).to.deep.equal(expectedNetworkCondition);
    });

    it('should throw error for invalid network type', async () => {
      return expect(
        networkHandler.setNetworkEmulation('invalid network'),
      ).to.eventually.rejectedWith(
        `Please set one of the given network types \n${[
          'GPRS',
          'Regular2G',
          'Good2G',
          'Regular3G',
          'Good3G',
          'Regular4G',
          'DSL',
          'WiFi',
          'Offline',
        ].join('\n')}`,
      );
    });

    it('should use networkType from config when not provided', async () => {
      process.env.TAIKO_EMULATE_NETWORK = 'GPRS';
      const expectedNetworkCondition = {
        offline: false,
        downloadThroughput: 6400,
        uploadThroughput: 2560,
        latency: 500,
      };
      await networkHandler.setNetworkEmulation();
      expect(actualNetworkCondition).to.deep.equal(expectedNetworkCondition);
    });
  });
});
