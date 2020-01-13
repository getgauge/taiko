const expect = require('chai').expect;
const rewire = require('rewire');
let networkHandler = rewire('../../lib/handlers/networkHandler');
const test_name = 'Intercept';

describe(test_name, () => {
  let actualOption;
  before(() => {
    networkHandler.__set__('network', {
      continueInterceptedRequest: options => {
        actualOption = options;
        return Promise.resolve();
      },
      requestWillBeSent: () => {},
      loadingFinished: () => {},
      loadingFailed: () => {},
      responseReceived: () => {},
      setCacheDisabled: () => {},
      setRequestInterception: () => {},
      requestIntercepted: () => {},
    });
  });

  afterEach(() => {
    networkHandler.resetInterceptors();
  });

  it('Check redirection using interception', async () => {
    networkHandler.addInterceptor({
      requestUrl: 'www.google.com',
      action: 'www.ibibo.com',
    });
    networkHandler.handleInterceptor({
      interceptionId: 'interceptionId',
      request: {
        url: 'http://www.google.com',
        method: 'GET',
      },
      resourceType: 'Document',
      isNavigationRequest: true,
    });
    expect(actualOption.url).to.equal('http://www.ibibo.com');
  });

  it('Block url', async () => {
    networkHandler.addInterceptor({ requestUrl: 'www.google.com' });
    networkHandler.handleInterceptor({
      interceptionId: 'interceptionId',
      request: {
        url: 'http://www.google.com',
        method: 'GET',
      },
      resourceType: 'Document',
      isNavigationRequest: true,
    });
    expect(actualOption.errorReason).to.equal('Failed');
  });

  it('Mock Response', async () => {
    networkHandler.addInterceptor({
      requestUrl: 'http://localhost:3000/api/customers/11',
      action: {
        body: {
          id: 11,
          firstName: 'ward',
          lastName: 'bell',
          gender: 'male',
          address: '12345 Central St.',
          city: 'Los Angeles',
          state: { abbreviation: 'CA', name: 'California' },
          latitude: 34.042552,
          longitude: -118.266429,
        },
      },
    });
    networkHandler.handleInterceptor({
      interceptionId: 'interceptionId',
      request: {
        url: 'http://localhost:3000/api/customers/11',
        method: 'GET',
      },
      resourceType: 'Document',
      isNavigationRequest: true,
    });
    let res = Buffer.from(actualOption.rawResponse, 'base64').toString('binary');
    expect(res).to.include('12345 Central St.');
  });

  it('More than one intercept added for the same requestUrl', async () => {
    let actualConsoleWarn;
    console.warn = log => {
      actualConsoleWarn = log;
    };
    networkHandler.addInterceptor({
      requestUrl: 'www.google.com',
      action: 'www.ibibo.com',
    });
    networkHandler.addInterceptor({
      requestUrl: 'www.google.com',
      action: 'www.gauge.org',
    });
    networkHandler.handleInterceptor({
      interceptionId: 'interceptionId',
      request: {
        url: 'http://www.google.com',
        method: 'GET',
      },
      resourceType: 'Document',
      isNavigationRequest: true,
    });
    let warningMessage =
      'WARNING: More than one intercept ["www.google.com","www.google.com"] found for request "http://www.google.com".\n Applying: intercept("www.google.com", "www.gauge.org")';
    expect(actualConsoleWarn).to.equal(warningMessage);
    expect(actualOption.url).to.equal('http://www.gauge.org');
  });

  it('intercept with count added for the requestUrl', async () => {
    let count = 3;
    networkHandler.addInterceptor({
      requestUrl: 'www.google.com',
      action: 'www.gauge.org',
      count,
    });

    for (var i = 0; i < count + 1; i++) {
      networkHandler.handleInterceptor({
        interceptionId: 'interceptionId',
        request: {
          url: 'http://www.google.com',
          method: 'GET',
        },
        resourceType: 'Document',
        isNavigationRequest: true,
      });
      var result = count === i ? undefined : 'http://www.gauge.org';
      expect(actualOption.url).to.equal(result);
    }
  });
  it('reset intercept for the requestUrl if interceptor is present for the url', async () => {
    networkHandler.addInterceptor({
      requestUrl: 'www.google.com',
      action: 'www.gauge.org',
    });
    var result = networkHandler.resetInterceptor('www.google.com');
    networkHandler.handleInterceptor({
      interceptionId: 'interceptionId',
      request: {
        url: 'http://www.google.com',
        method: 'GET',
      },
      resourceType: 'Document',
      isNavigationRequest: true,
    });
    expect(actualOption.url).to.equal(undefined);
    expect(result).to.equal(true);
  });
  it('reset intercept returns false if intercept does not exist for the requestUrl', async () => {
    var result = networkHandler.resetInterceptor('www.google.com');
    expect(result).to.equal(false);
  });
});
