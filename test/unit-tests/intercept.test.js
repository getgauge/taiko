const expect = require("chai").expect;
const rewire = require("rewire");
let fetchHandler = rewire("../../lib/handlers/fetchHandler");
const test_name = "Intercept";

describe(test_name, () => {
  let actualOption;
  beforeEach(() => {
    fetchHandler.__set__("fetch", {
      enable: () => {},
      requestPaused: () => {},
      continueRequest: (options) => {
        actualOption = options;
        return Promise.resolve();
      },
      failRequest: (options) => {
        actualOption = options;
        return Promise.resolve();
      },
      fulfillRequest: (options) => {
        actualOption = options;
        return Promise.resolve();
      },
    });
  });

  afterEach(() => {
    actualOption = null;
    fetchHandler.resetInterceptors();
    const createdSessionListener = fetchHandler.__get__(
      "createdSessionListener",
    );
    fetchHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
    fetchHandler = rewire("../../lib/handlers/fetchHandler");
    fetchHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
  });

  it("Check redirection using interception", async () => {
    fetchHandler.addInterceptor({
      requestUrl: "www.google.com",
      action: "www.ibibo.com",
    });
    fetchHandler.handleInterceptor({
      requestId: "requestId",
      request: {
        url: "http://www.google.com",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    });
    expect(actualOption.url).to.equal("http://www.ibibo.com");
  });

  it("Block url", async () => {
    fetchHandler.addInterceptor({ requestUrl: "www.google.com" });
    fetchHandler.handleInterceptor({
      requestId: "requestId",
      request: {
        url: "http://www.google.com",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    });
    expect(actualOption.errorReason).to.equal("Failed");
  });

  it("Mock Response", async () => {
    fetchHandler.addInterceptor({
      requestUrl: "http://localhost:3000/api/customers/11",
      action: {
        body: {
          id: 11,
          firstName: "ward",
          lastName: "bell",
          gender: "male",
          address: "12345 Central St.",
          city: "Los Angeles",
          state: { abbreviation: "CA", name: "California" },
          latitude: 34.042552,
          longitude: -118.266429,
        },
      },
    });
    fetchHandler.handleInterceptor({
      requestId: "requestId",
      request: {
        url: "http://localhost:3000/api/customers/11",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    });
    const res = Buffer.from(actualOption.body, "base64").toString("binary");
    expect(res).to.include("12345 Central St.");
  });

  it("Mock Response with empty body", async () => {
    fetchHandler.addInterceptor({
      requestUrl: "http://localhost:3000/api/customers/11",
      action: {},
    });
    const req = {
      requestId: "requestId",
      request: {
        url: "http://localhost:3000/api/customers/11",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    };

    expect(() => {
      fetchHandler.handleInterceptor(req);
    }).to.not.throw();
  });

  it("More than one intercept added for the same requestUrl", async () => {
    let actualConsoleWarn;
    console.warn = (log) => {
      actualConsoleWarn = log;
    };
    fetchHandler.addInterceptor({
      requestUrl: "www.google.com",
      action: "www.ibibo.com",
    });
    fetchHandler.addInterceptor({
      requestUrl: "www.google.com",
      action: "www.gauge.org",
    });
    fetchHandler.handleInterceptor({
      requestId: "requestId",
      request: {
        url: "http://www.google.com",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    });
    const warningMessage =
      'WARNING: More than one intercept ["www.google.com","www.google.com"] found for request "http://www.google.com".\n Applying: intercept("www.google.com", "www.gauge.org")';
    expect(actualConsoleWarn).to.equal(warningMessage);
    expect(actualOption.url).to.equal("http://www.gauge.org");
  });

  describe("Intercept with count added", async () => {
    const count = 3;
    beforeEach(() => {
      fetchHandler.addInterceptor({
        requestUrl: "www.google.com",
        action: "www.gauge.org",
        count,
      });
    });

    it("intercepts requestUrl", async () => {
      for (let i = 0; i < count + 1; i++) {
        fetchHandler.handleInterceptor({
          requestId: "requestId",
          request: {
            url: "http://www.google.com",
            method: "GET",
          },
          resourceType: "Document",
          isNavigationRequest: true,
        });
        const result = count === i ? undefined : "http://www.gauge.org";
        expect(actualOption.url).to.equal(result);
      }
    });

    it("maintains count amidst interleaving matched requests", async () => {
      for (let i = 0; i < count + 1; i++) {
        fetchHandler.handleInterceptor({
          requestId: "otherRequestId",
          request: {
            url: "http://www.otherrequest.com",
            method: "GET",
          },
          resourceType: "Document",
          isNavigationRequest: true,
        });
        fetchHandler.handleInterceptor({
          requestId: "requestId",
          request: {
            url: "http://www.google.com",
            method: "GET",
          },
          resourceType: "Document",
          isNavigationRequest: true,
        });
        const result = count === i ? undefined : "http://www.gauge.org";
        expect(actualOption.url).to.equal(result);
      }
    });
  });

  it("reset intercept for the requestUrl if interceptor is present for the url", async () => {
    fetchHandler.addInterceptor({
      requestUrl: "www.google.com",
      action: "www.gauge.org",
    });
    const result = fetchHandler.resetInterceptor("www.google.com");
    fetchHandler.handleInterceptor({
      requestId: "requestId",
      request: {
        url: "http://www.google.com",
        method: "GET",
      },
      resourceType: "Document",
      isNavigationRequest: true,
    });
    expect(actualOption.url).to.equal(undefined);
    expect(result).to.equal(true);
  });
  it("reset intercept returns false if intercept does not exist for the requestUrl", async () => {
    const result = fetchHandler.resetInterceptor("www.google.com");
    expect(result).to.equal(false);
  });
  it("reset interceptors should set interceptors empty array and userEnabledIntercept false", async () => {
    fetchHandler.__set__("interceptors", ["intercept1", "intercept2"]);
    fetchHandler.__set__("userEnabledIntercept", true);
    fetchHandler.resetInterceptors();
    expect(fetchHandler.__get__("interceptors")).to.be.empty;
    expect(fetchHandler.__get__("userEnabledIntercept")).to.be.false;
  });
  it("add interceptor should put a entry in interceptors", async () => {
    const intercept = { request: "action" };
    fetchHandler.addInterceptor(intercept);
    expect(fetchHandler.__get__("interceptors")[0]).to.deep.equal(intercept);
  });
  it("add interceptor should call enableFetchIntercept for the first time and set userEnabledIntercept to true", async () => {
    let called = false;
    fetchHandler.__set__("enableFetchIntercept", () => {
      called = true;
    });
    fetchHandler.addInterceptor("intercept");
    expect(fetchHandler.__get__("userEnabledIntercept")).to.be.true;
    expect(called).to.be.true;
  });
  it("add interceptor should not call enableFetchIntercept if userEnabledIntercept is set to true", async () => {
    let called = false;
    fetchHandler.__set__("enableFetchIntercept", () => {
      called = true;
    });
    fetchHandler.__set__("userEnabledIntercept", true);
    fetchHandler.addInterceptor("intercept");
    expect(fetchHandler.__get__("userEnabledIntercept")).to.be.true;
    expect(called).to.be.false;
  });
  it("createdSessionListener should call enableFetchIntercept if userEnabledIntercept is set to true", async () => {
    let called = false;
    fetchHandler.__set__("enableFetchIntercept", () => {
      called = true;
    });
    fetchHandler.__set__("userEnabledIntercept", true);
    fetchHandler.__get__("createdSessionListener")({ Fetch: "domain" });
    expect(fetchHandler.__get__("userEnabledIntercept")).to.be.true;
    expect(called).to.be.true;
  });
  it("createdSessionListener should not call enableFetchIntercept if userEnabledIntercept is set to false", async () => {
    let called = false;
    fetchHandler.__set__("enableFetchIntercept", () => {
      called = true;
    });
    fetchHandler.__set__("userEnabledIntercept", false);
    fetchHandler.__get__("createdSessionListener")({ Fetch: "domain" });
    expect(fetchHandler.__get__("userEnabledIntercept")).to.be.false;
    expect(called).to.be.false;
  });
});
