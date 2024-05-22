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

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const { helper, assert } = require('../helper');
const supportedPlatforms = ['mac-arm64', 'mac-x64', 'linux64', 'win32', 'win64'];

const readdirAsync = util.promisify(fs.readdir.bind(fs));
const browser = require('../../package.json').taiko.browser;

function existsAsync(filePath) {
  let fulfill = null;
  const promise = new Promise((x) => (fulfill = x));
  fs.access(filePath, (err) => fulfill(!err));
  return promise;
}

class BrowserMetadata {

  constructor() {
    this._downloadsFolder = path.join(helper.projectRoot(), '.local-chromium');
    const platform = os.platform();
    if (platform === 'darwin') {
      this._platform = os.arch() === 'arm64' ? 'mac-arm64' : 'mac-x64';
    } else if (platform === 'linux') {
      this._platform = 'linux64';
    } else if (platform === 'win32') {
      this._platform = os.arch() === 'x64' ? 'win64' : 'win32';
    }
    assert(this._platform, 'Unsupported platform: ' + os.platform());
    assert(supportedPlatforms.includes(this._platform), 'Unsupported platform: ' + this._platform);
    const download = browser.downloads.chrome.find(
      (download) => download.platform === this._platform,
    );
    this.downloadURL = download.url;
    this.revision = browser.revision;
  }

  /**
   * Returns the platform of the browser.
   * @return {string} The platform.
   */
  platform() {
    return this._platform;
  }

  /**
   * Determines the archive name based on the platform and revision number.
   * @return {string} The archive name.
   */
  archiveName() {
    if (this._platform === 'win32' || this.platform === 'win64') {
      // Windows archive name changed at r591479.
      return parseInt(this.revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
    } else {
      return `chrome-${this._platform}`;
    }
  }

  /**
   * @return {!Promise<!Array<string>>}
   */
  async localRevisions() {
    if (!(await existsAsync(this._downloadsFolder))) {
      return [];
    }
    const fileNames = await readdirAsync(this._downloadsFolder);
    return fileNames
      .map((fileName) => parseFolderPath(fileName))
      .filter((entry) => entry && entry.platform === this._platform)
      .map((entry) => entry.revision);
  }

  /**
   * @return {!BrowserMetadata.RevisionInfo}
   */
  revisionInfo() {
    const folderPath = this._getFolderPath(this.revision);
    let executablePath = '';
    if (this._platform.includes('mac')) {
      executablePath = path.join(
        folderPath,
        this.archiveName(),
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing',
      );
    } else if (this._platform === 'linux64') {
      executablePath = path.join(folderPath, this.archiveName(), 'chrome');
    } else if (this._platform === 'win32' || this._platform === 'win64') {
      executablePath = path.join(folderPath, this.archiveName(), 'chrome.exe');
    } else {
      throw 'Unsupported platform: ' + this._platform;
    }
    const local = fs.existsSync(folderPath);
    return {
      revision: this.revision,
      executablePath,
      folderPath,
      local,
      url: this.downloadURL,
    };
  }

  /**
   * @param {string} revision
   * @return {string}
   */
  _getFolderPath() {
    return path.join(this._downloadsFolder, this._platform + '-' + this.revision);
  }
}

module.exports = BrowserMetadata;

/**
 * @param {string} folderPath
 * @return {?{platform: string, revision: string}}
 */
function parseFolderPath(folderPath) {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 2) {
    return null;
  }
  const [platform, revision] = splits;
  if (!supportedPlatforms.includes(platform)) {
    return null;
  }
  return { platform, revision };
}


/**
 * @typedef {Object} BrowserMetadata.RevisionInfo
 * @property {string} folderPath
 * @property {string} executablePath
 * @property {string} url
 * @property {boolean} local
 * @property {string} revision
 */
