const { expect } = require("chai");
const rewire = require("rewire");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");

describe("BrowserMetadata", () => {
  let BrowserMetadata;

  beforeEach(() => {
    BrowserMetadata = rewire("taiko/lib/browser/metadata");
  });

  describe("parseFolderPath", () => {
    it("should correctly parse revisions for platforms with and without hyphens", () => {
      const parseFolderPath = BrowserMetadata.__get__("parseFolderPath");

      expect(parseFolderPath("linux64-1683791")).to.deep.equal({
        platform: "linux64",
        revision: "1683791",
      });
      expect(parseFolderPath("linux-arm64-1683791")).to.deep.equal({
        platform: "linux-arm64",
        revision: "1683791",
      });
      expect(parseFolderPath("mac-arm64-1683791")).to.deep.equal({
        platform: "mac-arm64",
        revision: "1683791",
      });
      expect(parseFolderPath("mac-x64-1683791")).to.deep.equal({
        platform: "mac-x64",
        revision: "1683791",
      });
      expect(parseFolderPath("win64-1683791")).to.deep.equal({
        platform: "win64",
        revision: "1683791",
      });
      expect(parseFolderPath("win32-1683791")).to.deep.equal({
        platform: "win32",
        revision: "1683791",
      });
    });

    it("should return null for invalid or unsupported folder paths", () => {
      const parseFolderPath = BrowserMetadata.__get__("parseFolderPath");

      expect(parseFolderPath("linux64")).to.be.null;
      expect(parseFolderPath("linux64-")).to.be.null;
      expect(parseFolderPath("-1683791")).to.be.null;
      expect(parseFolderPath("unsupported-1683791")).to.be.null;
      expect(parseFolderPath("download-linux64-1683791.zip")).to.be.null;
    });
  });

  describe("platform detection", () => {
    it("should detect linux-arm64 when running on Linux ARM64", () => {
      BrowserMetadata.__set__("os", {
        platform: () => "linux",
        arch: () => "arm64",
      });

      const metadata = new BrowserMetadata();
      expect(metadata.platform()).to.equal("linux-arm64");
      expect(metadata.downloadURL).to.include("linux-arm64");

      const info = metadata.revisionInfo();
      expect(info.executablePath).to.include(
        path.join("chrome-linux-arm64", "chrome"),
      );
    });

    it("should detect linux64 when running on Linux x64", () => {
      BrowserMetadata.__set__("os", {
        platform: () => "linux",
        arch: () => "x64",
      });

      const metadata = new BrowserMetadata();
      expect(metadata.platform()).to.equal("linux64");
      expect(metadata.downloadURL).to.include("linux64");

      const info = metadata.revisionInfo();
      expect(info.executablePath).to.include(
        path.join("chrome-linux64", "chrome"),
      );
    });

    it("should detect mac-arm64 and mac-x64 on macOS", () => {
      BrowserMetadata.__set__("os", {
        platform: () => "darwin",
        arch: () => "arm64",
      });
      const macArm = new BrowserMetadata();
      expect(macArm.platform()).to.equal("mac-arm64");

      BrowserMetadata.__set__("os", {
        platform: () => "darwin",
        arch: () => "x64",
      });
      const macX64 = new BrowserMetadata();
      expect(macX64.platform()).to.equal("mac-x64");
    });
  });

  describe("localRevisions", () => {
    it("should discover local revisions for hyphenated platform directories", async () => {
      const tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "taiko-metadata-test-"),
      );

      try {
        await fs.mkdir(path.join(tempDir, "mac-arm64-1000001"));
        await fs.mkdir(path.join(tempDir, "mac-arm64-1000002"));
        await fs.mkdir(path.join(tempDir, "linux64-1000003"));
        await fs.mkdir(path.join(tempDir, "unrelated-folder"));

        BrowserMetadata.__set__("os", {
          platform: () => "darwin",
          arch: () => "arm64",
        });

        const metadata = new BrowserMetadata();
        BrowserMetadata.__set__("helper", {
          projectRoot: () => tempDir,
        });
        metadata._downloadsFolder = tempDir;

        const revisions = await metadata.localRevisions();
        expect(revisions).to.have.members(["1000001", "1000002"]);
        expect(revisions).to.not.include("1000003");
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
