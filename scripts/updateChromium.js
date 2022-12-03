const https = require('https');
const { writeFileSync, readFileSync } = require('fs');
const { execSync } = require('child_process');
const BrowserFetcher = require(`${__dirname}/../lib/browserFetcher`);
const supportedPlatforms = BrowserFetcher.supportedPlatforms;

const PACKAGE_JSON = `${__dirname}/../package.json`;

async function checkAvailableRevision(revision, browserFetcher) {
  let results = await Promise.all(
    supportedPlatforms.map((platform) => browserFetcher.canDownload(revision, platform)),
  );
  if (results.includes(false)) {
    return await checkAvailableRevision(--revision, browserFetcher);
  } else {
    return revision;
  }
}

async function findLatestCommonRevision(chromiumReleases) {
  let latestRevisions = chromiumReleases
    .filter((release) => supportedPlatforms.includes(release.os))
    .map((release) => {
      let versions = release.versions.map((version) => parseInt(version.branch_base_position));
      return Math.max(...versions);
    });
  return await checkAvailableRevision(Math.min(...latestRevisions), new BrowserFetcher());
}

function updatePackageJSON(key, value) {
  const packageJSON = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8'));
  if (key === 'revision') {
    packageJSON.taiko.chromium_revision = `${value}`;
  } else {
    packageJSON.taiko.chromium_version = `${value}`;
  }
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(packageJSON, null, '  ')}\n`);
}

async function getChromeReleasesInfo() {
  return new Promise((resolve, reject) => {
    https
      .get('https://omahaproxy.appspot.com/all.json', (res) => {
        let data = '';
        res.on('data', (datum) => {
          data += datum;
        });
        res.on('end', () => {
          resolve(data);
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

async function main() {
  let releasesInfo = await getChromeReleasesInfo();
  let revision = await findLatestCommonRevision(JSON.parse(releasesInfo));
  let { chromium_revision } = require(PACKAGE_JSON).taiko;
  if (chromium_revision >= revision) {
    console.log(
      `Skipping updating package.json as current chromium revision(${chromium_revision}) is similar or greater than available revision(${revision}).`,
    );
    return;
  }
  updatePackageJSON('revision', revision);
  execSync(`node ${__dirname}/../lib/install.js`);
  let browserFetcher = new BrowserFetcher();
  let { executablePath } = browserFetcher.revisionInfo(revision);
  let out = execSync(`${executablePath} --version`);
  let versionInfo = out.toString();
  let version = versionInfo.replace(/[^0-9.]/g, '');
  updatePackageJSON('version', version);
}

main();
