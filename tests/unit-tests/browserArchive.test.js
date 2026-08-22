const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const chai = require("chai");
const AdmZip = require("adm-zip");
const extractZip = require("taiko/lib/browser/archive");

const expect = chai.expect;

// ZIP external file attributes pack the Unix mode into the upper 16 bits.
// >>> 0 coerces the result to unsigned 32-bit (JS bitwise ops are signed).
const S_IFLNK = 0xa000; // Unix file type: symbolic link
const S_IRWXALL = 0o777; // rwxrwxrwx permissions
const SYMLINK_ATTR = ((S_IFLNK | S_IRWXALL) << 16) >>> 0;

function createZipFixture() {
  const zip = new AdmZip();
  zip.addFile("browser/", Buffer.alloc(0));
  zip.addFile("browser/chrome", Buffer.from("chromium"));
  return zip.toBuffer();
}

function createSymlinkZipFixture() {
  const zip = new AdmZip();
  zip.addFile("browser/", Buffer.alloc(0));
  zip.addFile("browser/current", Buffer.from("chrome"));
  zip.getEntry("browser/current").attr = SYMLINK_ATTR;
  zip.addFile("browser/chrome", Buffer.from("chromium"));
  return zip.toBuffer();
}

function createUnsafeSymlinkZipFixture() {
  const zip = new AdmZip();
  zip.addFile("browser/", Buffer.alloc(0));
  zip.addFile("browser/current", Buffer.from("../../outside"));
  zip.getEntry("browser/current").attr = SYMLINK_ATTR;
  return zip.toBuffer();
}

describe("BrowserArchive", () => {
  it("waits for Chromium archive extraction to finish", async () => {
    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "taiko-browser-archive-"),
    );
    const zipPath = path.join(tempDirectory, "chromium.zip");
    const destinationPath = path.join(tempDirectory, "chromium");
    await fs.writeFile(zipPath, createZipFixture());

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
    await fs.writeFile(zipPath, createSymlinkZipFixture());

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
    await fs.writeFile(zipPath, createUnsafeSymlinkZipFixture());

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
