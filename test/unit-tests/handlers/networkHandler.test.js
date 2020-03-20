const chai = require('chai');
const rewire = require('rewire');
const expect = chai.expect;
const chaiAsPromissed = require('chai-as-promised');
chai.use(chaiAsPromissed);
let networkHandler = rewire('../../../lib/handlers/networkHandler');
const test_name = 'Network Handler';

describe(test_name, () => {
  let actualNetworkCondition, requestInterceptor, continueInterceptedRequestOptions;

  beforeEach(() => {
    delete process.env.TAIKO_EMULATE_NETWORK;
    let network = {
      requestWillBeSent: () => {},
      loadingFinished: () => {},
      loadingFailed: () => {},
      responseReceived: () => {},
      setCacheDisabled: () => {},
      setRequestInterception: () => {},
      requestIntercepted: () => {},
      emulateNetworkConditions: networkCondition => {
        actualNetworkCondition = networkCondition;
        return Promise.resolve();
      },
      continueInterceptedRequest: async options => {
        continueInterceptedRequestOptions = options;
      },
    };
    networkHandler.__set__('network', network);
    requestInterceptor = networkHandler.__get__('handleInterceptor');
  });
  afterEach(() => {
    actualNetworkCondition = {};
    continueInterceptedRequestOptions = null;
    process.env.TAIKO_EMULATE_NETWORK = '';
  });
  describe('setNetworkEmulation', () => {
    it('should invoke emulateNetworkConditions with correct options', async () => {
      const expectedNetworkCondition = {
        offline: false,
        downloadThroughput: 6400,
        uploadThroughput: 2560,
        latency: 500,
      };
      await networkHandler.setNetworkEmulation('GPRS');
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

  describe('http headers', () => {
    let headersAndHost;
    before(() => {
      headersAndHost = [
        [{ header1: 'header1 value' }, 'https://example.com'],
        [{ header3: 'header2 value' }, 'https://another-example.com'],
        [{ header4: 'header3 value' }, 'file://path/to/some/file'],
      ];
      headersAndHost.forEach(headerAndHost => {
        networkHandler.setHTTPHeaders(headerAndHost[0], headerAndHost[1]);
      });
    });
    it('should set appropriate headers for a host', () => {
      headersAndHost.forEach((headerAndHost, index) => {
        const hostUrl = headerAndHost[1];
        const headers = headerAndHost[0];
        requestInterceptor({
          interceptionId: index,
          request: { url: hostUrl, headers: {} },
        });
        expect(continueInterceptedRequestOptions).to.be.deep.equal({
          interceptionId: index,
          headers: headers,
        });
      });
    });

    it('should not overwrite headers for a host', () => {
      requestInterceptor({
        interceptionId: 123,
        request: { url: 'https://example.com', headers: { header1: 'header1 custom value' } },
      });
      expect(continueInterceptedRequestOptions).to.be.deep.equal({ interceptionId: 123 });
    });
  });
});
