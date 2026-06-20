const chai = require("chai");
const rewire = require("rewire");

const expect = chai.expect;

describe("BrowserFetcher", () => {
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
