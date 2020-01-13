const chai = require('chai');
const rewire = require('rewire');
const expect = chai.expect;
const chaiAsPromissed = require('chai-as-promised');
chai.use(chaiAsPromissed);
let networkHandler = rewire('../../../lib/handlers/networkHandler');
const test_name = 'Network Handler';

describe(test_name, () => {
  let actualNetworkCondition;

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
    };
    networkHandler.__set__('network', network);
  });
  afterEach(() => {
    actualNetworkCondition = {};
    process.env.TAIKO_EMULATE_NETWORK = '';
  });

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
    return expect(networkHandler.setNetworkEmulation('invalid network')).to.eventually.rejectedWith(
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
