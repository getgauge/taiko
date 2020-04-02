const https = require('https');
const { writeFileSync } = require('fs');
const { supportedPlatforms } = require('./lib/browserFetcher');

function getStableVersionInfo(chromiumReleases) {
  let chromiumStableReleases = chromiumReleases
    .filter((release) => supportedPlatforms.includes(release.os))
    .map((release) => {
      release.versions = release.versions.filter((version) => version.channel === 'stable');
      return release;
    });
  let { branch_base_position: revision, version } = chromiumStableReleases[0].versions[0];
  let hasRevisionForAllPlatform = chromiumStableReleases.slice(1).every((stableRelease) => {
    let versioInfp = stableRelease.versions[0];
    return versioInfp.branch_base_position === revision;
  });
  if (!hasRevisionForAllPlatform) {
    console.error(`The stable release revision(${revision}) does  ot exist for all platforms.`);
    process.exit(1);
  }
  return { revision, version };
}

function updatePackageJSON({ revision, version }) {
  let packageJSON = require('./package.json');
  if (parseInt(packageJSON.taiko.chromium_revision) < parseInt(revision)) {
    packageJSON.taiko.chromium_revision = revision;
    packageJSON.taiko.chromium_version = version;
    writeFileSync('./package.json', `${JSON.stringify(packageJSON, null, '  ')}\n`);
  } else {
    console.log(
      `Skipp updating packag.json as current chromium revision(${packageJSON.taiko.chromium_revision}) is similar or greater than available revision(${revision}).`,
    );
  }
}

function main() {
  https
    .get('https://omahaproxy.appspot.com/all.json', (res) => {
      let data = '';
      res.on('data', (datum) => {
        data += datum;
      });
      res.on('end', () => {
        let versionInfo = getStableVersionInfo(JSON.parse(data));
        updatePackageJSON(versionInfo);
      });
    })
    .on('error', (e) => {
      console.error(e);
    });
}

main();
