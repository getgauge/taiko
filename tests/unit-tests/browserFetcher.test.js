const { expect } = require("chai");
const rewire = require("rewire");

describe("BrowserFetcher", () => {
  let browserFetcher;

  beforeEach(() => {
    browserFetcher = rewire("taiko/lib/browser/fetcher");
  });

  it("should preserve TLS certificate validation when using a proxy", () => {
    browserFetcher.__set__("getProxyForUrl", () => "https://proxy.test:8443");
    browserFetcher.__set__(
      "ProxyAgent",
      function ProxyAgent(proxyURL) {
        this.proxyURL = proxyURL;
      },
    );

    const createRequestOptions = browserFetcher.__get__(
      "createRequestOptions",
    );

    const options = createRequestOptions(
      "https://storage.googleapis.com/chromium.zip",
      "GET",
    );

    expect(options.agent).to.exist;
    expect(options).to.not.have.property("rejectUnauthorized");
  });

  it("reports locally installed Chromium revisions", async () => {
    const browserFetcherModule = rewire("taiko/lib/browser/fetcher");
    const revert = browserFetcherModule.__set__("metadata", {
      platform: () => "linux64",
      downloadURL: "https://example.test/chromium.zip",
      revisionInfo: () => ({ revision: "123" }),
      localRevisions: async () => ["123"],
    });

    try {
      const browserFetcher = new browserFetcherModule();
      expect(await browserFetcher.localRevisions()).to.deep.equal(["123"]);
    } finally {
      revert();
    }
  });
});
