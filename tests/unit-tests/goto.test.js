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
    taiko = require("taiko/lib/taiko");
    taiko.__reset__();
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
    taiko.__reset__();
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

  const urlTransformCases = [
    {
      label: "https protocol untouched",
      input: "https://example.com",
      expected: "https://example.com",
    },
    {
      label: "file protocol untouched",
      input: "file://example.com",
      expected: "file://example.com",
    },
    {
      label: "chrome-extension protocol untouched",
      input: "chrome-extension://gjaerjgaerjeoareapoj/internalPage.html",
      expected: "chrome-extension://gjaerjgaerjeoareapoj/internalPage.html",
    },
    {
      label: "adds http:// when no protocol given",
      input: "example.com",
      expected: "http://example.com",
    },
    {
      label: 'does not add http:// for "about:*" urls',
      input: "about:randomString",
      expected: "about:randomString",
    },
    {
      label: "adds http:// for url with port specified",
      input: "localhost:8080",
      expected: "http://localhost:8080",
    },
  ];

  for (const { label, input, expected } of urlTransformCases) {
    it(`URL: ${label}`, async () => {
      await taiko.goto(input);
      expect(actualUrl, `navigated URL for input "${input}"`).to.equal(expected);
    });
  }

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
