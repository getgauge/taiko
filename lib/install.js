/**
 * Copyright 2018 Thoughtworks Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * This module is imported from Puppeteer(https://github.com/GoogleChrome/puppeteer)
 * Few modifications are done on the file.
 */
const BrowserFetcher = require('./browserFetcher');
const revision = require('./../package.json').taiko.chromium_revision;
const downloadHost = process.env.TAIKO_CHROMIUM_URL;
const browserFetcher = new BrowserFetcher({ host: downloadHost });
const revisionInfo = browserFetcher.revisionInfo(revision);

let progressBar = null;
let lastDownloadedBytes = 0;

/**
 * @param {!Array<string>}
 * @return {!Promise}
 */
function onSuccess(localRevisions) {
  console.log('Chromium downloaded to ' + revisionInfo.folderPath);
  localRevisions = localRevisions.filter((revision) => revision !== revisionInfo.revision);
  // Remove previous chromium revisions.
  const cleanupOldVersions = localRevisions.map((revision) => browserFetcher.remove(revision));
  return Promise.all([...cleanupOldVersions]);
}

/**
 * @param {!Error} error
 */
function onError(error) {
  console.error(
    `ERROR: Failed to download Chromium r${revision}! Set "TAIKO_SKIP_CHROMIUM_DOWNLOAD" env variable to skip download.`,
  );
  console.error(error);
  process.exit(1);
}

function onProgress(downloadedBytes, totalBytes) {
  if (!progressBar) {
    const ProgressBar = require('progress');
    progressBar = new ProgressBar(
      `Downloading Chromium r${revision} - ${toMegabytes(totalBytes)} [:bar] :percent :etas `,
      {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: totalBytes,
      },
    );
  }
  const delta = downloadedBytes - lastDownloadedBytes;
  lastDownloadedBytes = downloadedBytes;
  progressBar.tick(delta);
}

function toMegabytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} Mb`;
}

function main() {
  if (
    process.env.TAIKO_SKIP_CHROMIUM_DOWNLOAD &&
    process.env.TAIKO_SKIP_CHROMIUM_DOWNLOAD.toLowerCase() !== 'false'
  ) {
    console.log('Skipping Chromium Download as given in environment variable.');
    return;
  }

  if (
    process.env.NPM_CONFIG_TAIKO_SKIP_CHROMIUM_DOWNLOAD ||
    process.env.npm_config_taiko_skip_chromium_download
  ) {
    console.log('Skipping Chromium Download as given in npm config.');
    return;
  }

  // Do nothing if the revision is already downloaded.
  if (revisionInfo.local) {
    console.log('Skipping Chromium Download as the revision is already found.');
    return;
  }

  browserFetcher
    .download(revisionInfo.revision, onProgress)
    .then(() => browserFetcher.localRevisions())
    .then(onSuccess)
    .catch(onError);
}

main();
