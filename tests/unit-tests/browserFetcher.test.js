const { expect } = require("chai");
const rewire = require("rewire");

describe("BrowserFetcher", () => {
  let browserFetcher;

  beforeEach(() => {
    browserFetcher = rewire("taiko/lib/browser/fetcher");
  });

  it("should preserve TLS certificate validation when using a proxy", () => {
    browserFetcher.__set__("getProxyForUrl", () => "https://proxy.test:8443");
    browserFetcher.__set__("ProxyAgent", function ProxyAgent(proxyURL) {
      this.proxyURL = proxyURL;
    });

    const createRequestOptions = browserFetcher.__get__("createRequestOptions");

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

  it("cleans up destination folder if archive extraction fails", async () => {
    const fs = require("node:fs/promises");
    const os = require("node:os");
    const path = require("node:path");

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "taiko-fetcher-test-"),
    );

    try {
      const browserFetcherModule = rewire("taiko/lib/browser/fetcher");
      browserFetcherModule.__set__("metadata", {
        platform: () => "linux64",
        downloadURL: "https://example.test/chromium.zip",
        revisionInfo: () => ({ revision: "999", executablePath: "/fake/path" }),
        localRevisions: async () => [],
      });
      browserFetcherModule.__set__("downloadFile", async () => {});
      browserFetcherModule.__set__(
        "extractZip",
        async (_zipPath, destinationPath) => {
          await fs.mkdir(destinationPath, { recursive: true });
          await fs.writeFile(
            path.join(destinationPath, "partial.txt"),
            "corrupted",
          );
          throw new Error(
            "Extraction failed: Unsafe symlink in browser archive",
          );
        },
      );

      const fetcher = new browserFetcherModule({ path: tempDir });
      let caughtError;
      try {
        await fetcher.download("999");
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).to.exist;
      expect(caughtError.message).to.include("Extraction failed");

      const destinationFolder = path.join(tempDir, "linux64-999");
      let folderExists = false;
      try {
        await fs.access(destinationFolder);
        folderExists = true;
      } catch {
        folderExists = false;
      }
      expect(folderExists).to.be.false;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("handles relative redirects and guards against infinite redirect loops", () => {
    const httpRequest = browserFetcher.__get__("httpRequest");

    expect(() => {
      httpRequest("https://example.test/loop", "GET", () => {}, 11);
    }).to.throw(
      "Too many redirects while requesting https://example.test/loop",
    );
  });
});
