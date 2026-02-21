import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON_PATH = join(
  // @ts-expect-error
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "package.json",
);

interface ChromeDownload {
  platform: string;
  url: string;
}

interface Downloads {
  chrome: ChromeDownload[];
}

interface ChromeReleaseInfo {
  version: string;
  revision: string;
  downloads: Downloads;
}

class ChromeUpdater {
  private readPackageJSON() {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
  }

  private writePackageJSON(content: ChromeReleaseInfo): void {
    writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(content, null, 2)}\n`);
  }

  public async updateChromeVersion(): Promise<void> {
    try {
      const latestVersion = await this.fetchLatestChromeVersion();
      const currentVersion = this.getCurrentChromeVersion();

      if (!currentVersion) {
        this.updatePackageJSON(latestVersion);
        return;
      }

      if (currentVersion.revision < latestVersion.revision) {
        console.log(
          `Updating to latest chrome version: ${latestVersion.version}`,
        );
        this.updatePackageJSON(latestVersion);
        execSync(`node ${__dirname}/../lib/install.js`);
      } else {
        console.log(
          `Current chrome version (${currentVersion.revision}) is up to date with the latest version (${latestVersion.revision}).`,
        );
      }
    } catch (error) {
      console.error(`Error updating chrome version: ${error}`);
    }
  }

  private getCurrentChromeVersion(): ChromeReleaseInfo {
    const packageJSON = this.readPackageJSON();
    return packageJSON.taiko.browser as ChromeReleaseInfo;
  }

  private updatePackageJSON(releaseInfo: ChromeReleaseInfo): void {
    const packageJSON = this.readPackageJSON();
    const filteredReleaseInfo: ChromeReleaseInfo = {
      version: releaseInfo.version,
      revision: releaseInfo.revision,
      downloads: { chrome: releaseInfo.downloads.chrome },
    };
    packageJSON.taiko.browser = filteredReleaseInfo;
    this.writePackageJSON(packageJSON);
  }

  private async fetchLatestChromeVersion(): Promise<ChromeReleaseInfo> {
    const response = await fetch(
      "https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json",
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { versions: ChromeReleaseInfo[] };
    const versions = data.versions;
    return versions.slice(-1)[0] as ChromeReleaseInfo;
  }
}

async function main() {
  await new ChromeUpdater().updateChromeVersion();
}

main();
