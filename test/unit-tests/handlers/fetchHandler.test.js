const chai = require("chai");
const rewire = require("rewire");
const expect = chai.expect;
const chaiAsPromissed = require("chai-as-promised");
chai.use(chaiAsPromissed);

describe("Fetch Handler", () => {
  let requestInterceptor;
  let continueInterceptedRequestOptions;
  let fetchHandler;

  before(() => {
    fetchHandler = rewire("../../../lib/handlers/fetchHandler");
    const fetch = {
      enable: () => {},
      requestPaused: () => {},
      continueRequest: async (options) => {
        continueInterceptedRequestOptions = options;
      },
    };
    fetchHandler.__set__("fetch", fetch);
    requestInterceptor = fetchHandler.__get__("handleInterceptor");
  });

  after(() => {
    const createdSessionListener = fetchHandler.__get__(
      "createdSessionListener",
    );
    fetchHandler
      .__get__("eventHandler")
      .removeListener("createdSession", createdSessionListener);
    fetchHandler = rewire("../../../lib/handlers/fetchHandler");
    fetchHandler
      .__get__("eventHandler")
      .removeListener(
        "createdSession",
        fetchHandler.__get__("createdSessionListener"),
      );
    continueInterceptedRequestOptions = null;
  });

  describe("http headers", () => {
    let headersAndHost;
    let expectedHeaders;
    before(() => {
      headersAndHost = [
        [{ header1: "header1 value" }, "https://example.com"],
        [{ header3: "header2 value" }, "https://another-example.com"],
        [{ header4: "header3 value" }, "file://path/to/some/file"],
      ];
      expectedHeaders = [
        [
          {
            name: "header1",
            value: "header1 value",
          },
        ],
        [
          {
            name: "header3",
            value: "header2 value",
          },
        ],
        [
          {
            name: "header4",
            value: "header3 value",
          },
        ],
      ];
      headersAndHost.forEach((headerAndHost) => {
        fetchHandler.setHTTPHeaders(headerAndHost[0], headerAndHost[1]);
      });
    });
    it("should set appropriate headers for a host", () => {
      headersAndHost.forEach((headerAndHost, index) => {
        const hostUrl = headerAndHost[1];
        const headers = expectedHeaders[index];
        requestInterceptor({
          requestId: index,
          request: { url: hostUrl, headers: {} },
        });
        expect(continueInterceptedRequestOptions).to.be.deep.equal({
          requestId: index,
          headers: headers,
        });
      });
    });

    it("should not overwrite headers for a host", () => {
      requestInterceptor({
        requestId: 123,
        request: {
          url: "https://example.com",
          headers: { header1: "header1 custom value" },
        },
      });
      expect(continueInterceptedRequestOptions).to.be.deep.equal({
        requestId: 123,
      });
    });
  });
});
