const expect = require('chai').expect;
const { EventEmitter } = require('events');
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');

describe('openTab', () => {
  let actualTarget, target, actualOptions, actualUrl;
  before(async () => {
    let mockCri = {
      New: async function(options) {
        actualUrl = options.url;
        return target;
      },
    };
    let mockConnectToCri = target => {
      actualTarget = target;
    };
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko.__set__('validate', () => {});
    taiko.__set__('doActionAwaitingNavigation', mockWrapper);
    taiko.__set__('cri', mockCri);
    taiko.__set__('connect_to_cri', mockConnectToCri);
    taiko.__set__('_client', new EventEmitter());
  });

  it('Open tab without any url should call connectToCri', async () => {
    await taiko.openTab();
    expect(actualTarget).to.deep.equal(target);
  });

  it('Should not alter the url if protocol is given', async () => {
    let expectedUrl = 'http://gauge.org';
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = 'file://example.com';
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it('should add protocol http:// if not given', async () => {
    let expectedUrl = 'gauge.org';
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal('http://' + expectedUrl);
  });

  it('should call doActionAwaitingNavigation with default options if options not given', async () => {
    let expectedOptions = {
      navigationTimeout: 30000,
      waitForNavigation: true,
      waitForStart: 100,
    };
    await taiko.openTab('example.com');
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it('should call doActionAwaitingNavigation with given options', async () => {
    let expectedOptions = {
      navigationTimeout: 40000,
      waitForNavigation: false,
      waitForEvents: ['firstMeaningfulPaint'],
    };
    await taiko.openTab('example.com', expectedOptions);
    expect(actualOptions).to.deep.equal(expectedOptions);
  });
});
