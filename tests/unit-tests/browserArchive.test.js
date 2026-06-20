const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const chai = require("chai");
const extractZip = require("taiko/lib/browser/archive");

const expect = chai.expect;
const ZIP_FIXTURE =
  "UEsDBAoAAAAAAGtQ1FwAAAAAAAAAAAAAAAAIABwAYnJvd3Nlci9VVAkAA1lXNmpZVzZqdXgLAAEE9gEAAAQAAAAAUEsDBAoAAAAAAGtQ1FzCeZYxCAAAAAgAAAAOABwAYnJvd3Nlci9jaHJvbWVVVAkAA1lXNmpZVzZqdXgLAAEE9gEAAAQAAAAAY2hyb21pdW1QSwECHgMKAAAAAABrUNRcAAAAAAAAAAAAAAAACAAYAAAAAAAAABAA7UEAAAAAYnJvd3Nlci9VVAUAA1lXNmp1eAsAAQT2AQAABAAAAABQSwECHgMKAAAAAABrUNRcwnmWMQgAAAAIAAAADgAYAAAAAAABAAAA7YFCAAAAYnJvd3Nlci9jaHJvbWVVVAUAA1lXNmp1eAsAAQT2AQAABAAAAABQSwUGAAAAAAIAAgCiAAAAkgAAAAAA";
const SYMLINK_ZIP_FIXTURE =
  "UEsDBAoAAAAAAGdQ1FwAAAAAAAAAAAAAAAAIABwAYnJvd3Nlci9VVAkAA1FXNmpRVzZqdXgLAAEE9gEAAAQAAAAAUEsDBAoAAAAAAGdQ1FzshNb5BgAAAAYAAAAPABwAYnJvd3Nlci9jdXJyZW50VVQJAANRVzZqUVc2anV4CwABBPYBAAAEAAAAAGNocm9tZVBLAwQKAAAAAABnUNRcwnmWMQgAAAAIAAAADgAcAGJyb3dzZXIvY2hyb21lVVQJAANRVzZqUVc2anV4CwABBPYBAAAEAAAAAGNocm9taXVtUEsBAh4DCgAAAAAAZ1DUXAAAAAAAAAAAAAAAAAgAGAAAAAAAAAAQAO1BAAAAAGJyb3dzZXIvVVQFAANRVzZqdXgLAAEE9gEAAAQAAAAAUEsBAh4DCgAAAAAAZ1DUXOyE1vkGAAAABgAAAA8AGAAAAAAAAAAAAO2hQgAAAGJyb3dzZXIvY3VycmVudFVUBQADUVc2anV4CwABBPYBAAAEAAAAAFBLAQIeAwoAAAAAAGdQ1FzCeZYxCAAAAAgAAAAOABgAAAAAAAEAAADtgZEAAABicm93c2VyL2Nocm9tZVVUBQADUVc2anV4CwABBPYBAAAEAAAAAFBLBQYAAAAAAwADAPcAAADhAAAAAAA=";
const UNSAFE_SYMLINK_ZIP_FIXTURE =
  "UEsDBAoAAAAAAPVQ1FwAAAAAAAAAAAAAAAAIABwAYnJvd3Nlci9VVAkAA15YNmpeWDZqdXgLAAEE9gEAAAQAAAAAUEsDBAoAAAAAAPVQ1FxASv+xDQAAAA0AAAAPABwAYnJvd3Nlci9jdXJyZW50VVQJAANeWDZqXlg2anV4CwABBPYBAAAEAAAAAC4uLy4uL291dHNpZGVQSwECHgMKAAAAAAD1UNRcAAAAAAAAAAAAAAAACAAYAAAAAAAAABAA7UEAAAAAYnJvd3Nlci9VVAUAA15YNmp1eAsAAQT2AQAABAAAAABQSwECHgMKAAAAAAD1UNRcQEr/sQ0AAAANAAAADwAYAAAAAAAAAAAA7aFCAAAAYnJvd3Nlci9jdXJyZW50VVQFAANeWDZqdXgLAAEE9gEAAAQAAAAAUEsFBgAAAAACAAIAowAAAJgAAAAAAA==";

describe("BrowserArchive", () => {
  it("waits for Chromium archive extraction to finish", async () => {
    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "taiko-browser-archive-"),
    );
    const zipPath = path.join(tempDirectory, "chromium.zip");
    const destinationPath = path.join(tempDirectory, "chromium");
    await fs.writeFile(zipPath, Buffer.from(ZIP_FIXTURE, "base64"));

    try {
      await Promise.race([
        extractZip(zipPath, destinationPath),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("archive extraction did not finish")),
            1000,
          ),
        ),
      ]);

      expect(
        await fs.readFile(
          path.join(destinationPath, "browser", "chrome"),
          "utf8",
        ),
      ).to.equal("chromium");
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  });

  it("preserves symlinks in Chromium archives", async function () {
    if (process.platform === "win32") {
      this.skip();
    }

    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "taiko-browser-archive-"),
    );
    const zipPath = path.join(tempDirectory, "chromium.zip");
    const destinationPath = path.join(tempDirectory, "chromium");
    await fs.writeFile(zipPath, Buffer.from(SYMLINK_ZIP_FIXTURE, "base64"));

    try {
      await extractZip(zipPath, destinationPath);

      const linkPath = path.join(destinationPath, "browser", "current");
      expect((await fs.lstat(linkPath)).isSymbolicLink()).to.equal(true);
      expect(await fs.readlink(linkPath)).to.equal("chrome");
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  });

  it("rejects symlinks that escape the extraction directory", async function () {
    if (process.platform === "win32") {
      this.skip();
    }

    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "taiko-browser-archive-"),
    );
    const zipPath = path.join(tempDirectory, "chromium.zip");
    const destinationPath = path.join(tempDirectory, "chromium");
    await fs.writeFile(
      zipPath,
      Buffer.from(UNSAFE_SYMLINK_ZIP_FIXTURE, "base64"),
    );

    try {
      let extractionError;
      try {
        await extractZip(zipPath, destinationPath);
      } catch (error) {
        extractionError = error;
      }

      expect(extractionError).to.be.an("error");
      expect(extractionError.message).to.equal(
        "Unsafe symlink in browser archive: browser/current",
      );
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  });
});
