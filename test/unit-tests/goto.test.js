const rewire = require("rewire");
const expect = require("chai").expect;
const test_name = "Goto";

describe(test_name, () => {
  let actualHeader;
  let actualDomain;
  let actualUrl;
  let actualOptions;
  let taiko;
  let validateCalled = false;

  before(() => {
    taiko = rewire("../../lib/taiko");
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko.__set__("doActionAwaitingNavigation", mockWrapper);
    taiko.__set__("validate", () => {
      validateCalled = true;
    });
    taiko.__set__("fetchHandler", {
      setHTTPHeaders: (header, domain) => {
        actualHeader = header;
        actualDomain = domain;
      },
    });
    taiko.__set__("pageHandler", {
      handleNavigation: (url) => {
        actualUrl = url;
        return {
          redirectedResponse: [
            {
              status: 301,
              statusText: "Moved Permanently",
              url: "http://gauge.org",
            },
          ],
          url: "http://gauge.org",
          status: 200,
          statusText: "OK",
        };
      },
    });
  });

  after(() => {
    taiko = rewire("../../lib/taiko");
  });

  afterEach(() => {
    actualHeader = "";
    actualDomain = "";
    actualUrl = "";
    actualOptions = "";
    validateCalled = false;
  });

  it("should call validate to check if browser is opened", async () => {
    await taiko.goto("example.com");
    expect(validateCalled).to.be.true;
  });

  it("should not alter the url if protocol is given", async () => {
    let expectedUrl = "https://example.com";
    await taiko.goto(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = "file://example.com";
    await taiko.goto(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = "chrome-extension://gjaerjgaerjeoareapoj/internalPage.html";
    await taiko.goto(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it("should add protocol http:// if not given", async () => {
    const urlWithoutProtocol = "example.com";
    const expectedUrl = `http://${urlWithoutProtocol}`;
    await taiko.goto(urlWithoutProtocol);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it('should not add protocol http:// if url is "about:*"', async () => {
    const aboutBlank = "about:randomString";
    const expectedUrl = aboutBlank;
    await taiko.goto(aboutBlank);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it("should add protocol http:// for url with port specified", async () => {
    const urlWithPort = "localhost:8080";
    const expectedUrl = `http://${urlWithPort}`;
    await taiko.goto(urlWithPort);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it("should configure provided headers for the domain", async () => {
    const options = {
      headers: { Authorization: "Basic cG9zdG1hbjpwYXNzd29y2A==" },
    };
    await taiko.goto("example.com", options);
    expect(actualHeader).to.deep.equal(options.headers);
    expect(actualDomain).to.deep.equal("http://example.com");
  });

  it("should configure provided headers and file name as domain", async () => {
    const options = {
      headers: { Authorization: "Basic cG9zdG1hbjpwYXNzd29y2A==" },
    };
    const expectedFilePath = "file://some/file/path";
    await taiko.goto(expectedFilePath, options);
    expect(actualHeader).to.deep.equal(options.headers);
    expect(actualDomain).to.deep.equal(expectedFilePath);
  });

  it("should call doActionAwaitingNavigation with default options if options not given", async () => {
    const expectedOptions = {
      navigationTimeout: 30000,
      waitForNavigation: true,
      waitForStart: 100,
      waitForEvents: [],
    };
    await taiko.goto("example.com");
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it("should call doActionAwaitingNavigation with given options", async () => {
    const expectedOptions = {
      navigationTimeout: 40000,
      waitForNavigation: false,
      waitForEvents: ["firstMeaningfulPaint"],
    };
    await taiko.goto("example.com", expectedOptions);
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it("should return status code", async () => {
    const status = await taiko.goto("example.com");
    expect(status).to.deep.equal({
      redirectedResponse: [
        {
          status: 301,
          statusText: "Moved Permanently",
          url: "http://gauge.org",
        },
      ],
      url: "http://gauge.org",
      status: 200,
      statusText: "OK",
    });
  });
});
