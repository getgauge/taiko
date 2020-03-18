const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
const expect = require('chai').expect;
let test_name = 'Goto';

describe(test_name, () => {
  let actualHeader,
    actualUrl,
    actualOptions,
    validateCalled = false;

  before(() => {
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko.__set__('doActionAwaitingNavigation', mockWrapper);
    taiko.__set__('validate', () => {
      validateCalled = true;
    });
    taiko.__set__('network', {
      setExtraHTTPHeaders: header => {
        actualHeader = header;
      },
    });
    taiko.__set__('pageHandler', {
      handleNavigation: url => {
        actualUrl = url;
      },
    });
  });

  afterEach(() => {
    actualHeader = '';
    actualUrl = '';
    actualOptions = '';
    validateCalled = false;
  });

  it('should call validate to check if browser is opened', async () => {
    await taiko.goto('example.com');
    expect(validateCalled).to.be.true;
  });

  it('should not alter the url if protocol(https:// or file://) is given', async () => {
    let expectedUrl = 'https://example.com';
    await taiko.goto(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = 'file://example.com';
    await taiko.goto(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it('should add protocol http:// if not given', async () => {
    let urlWithoutProtocol = 'example.com';
    let expectedUrl = 'http://' + urlWithoutProtocol;
    await taiko.goto(urlWithoutProtocol);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it('should call network.setExtraHTTPHeaders if header option is set', async () => {
    let options = {
      headers: { Authorization: 'Basic cG9zdG1hbjpwYXNzd29y2A==' },
    };
    await taiko.goto('example.com', options);
    expect(actualHeader.headers).to.deep.equal(options.headers);
  });

  it('should call doActionAwaitingNavigation with default options if options not given', async () => {
    let expectedOptions = {
      navigationTimeout: 30000,
      waitForNavigation: true,
      waitForStart: 100,
    };
    await taiko.goto('example.com');
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it('should call doActionAwaitingNavigation with given options', async () => {
    let expectedOptions = {
      navigationTimeout: 40000,
      waitForNavigation: false,
      waitForEvents: ['firstMeaningfulPaint'],
    };
    await taiko.goto('example.com', expectedOptions);
    expect(actualOptions).to.deep.equal(expectedOptions);
  });
});
