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
const extract = require('extract-zip');
const util = require('util');
const URL = require('url');
const { helper, assert } = require('./helper');
const readline = require('readline');
const preferredRevision = require(path.join(helper.projectRoot(), 'package.json')).taiko
  .chromium_revision;
var url = require('url');
const ProxyAgent = require('https-proxy-agent');
const getProxyForUrl = require('proxy-from-env').getProxyForUrl;
const supportedPlatforms = ['mac', 'linux', 'win32', 'win64'];
const DEFAULT_DOWNLOAD_HOST = 'https://storage.googleapis.com';
const downloadURLs = {
  linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
  mac: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
  win32: '%s/chromium-browser-snapshots/Win/%d/%s.zip',
  win64: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
};

const readdirAsync = helper.promisify(fs.readdir.bind(fs));
const mkdirAsync = helper.promisify(fs.mkdir.bind(fs));
const unlinkAsync = helper.promisify(fs.unlink.bind(fs));
const chmodAsync = helper.promisify(fs.chmod.bind(fs));

function existsAsync(filePath) {
  let fulfill = null;
  const promise = new Promise((x) => (fulfill = x));
  fs.access(filePath, (err) => fulfill(!err));
  return promise;
}

function archiveName(platform, revision) {
  if (platform === 'linux') {
    return 'chrome-linux';
  }
  if (platform === 'mac') {
    return 'chrome-mac';
  }
  if (platform === 'win32' || platform === 'win64') {
    // Windows archive name changed at r591479.
    return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
  }
  return null;
}

function downloadURL(platform, host, revision) {
  return util.format(downloadURLs[platform], host, revision, archiveName(platform, revision));
}

class BrowserFetcher {
  /**
   * @param {!BrowserFetcher.Options=} options
   */
  constructor(options = {}) {
    this._downloadsFolder = options.path || path.join(helper.projectRoot(), '.local-chromium');
    this._downloadHost = options.host || DEFAULT_DOWNLOAD_HOST;
    this._platform = options.platform || '';
    if (!this._platform) {
      const platform = os.platform();
      if (platform === 'darwin') {
        this._platform = 'mac';
      } else if (platform === 'linux') {
        this._platform = 'linux';
      } else if (platform === 'win32') {
        this._platform = os.arch() === 'x64' ? 'win64' : 'win32';
      }
      assert(this._platform, 'Unsupported platform: ' + os.platform());
    }
    assert(supportedPlatforms.includes(this._platform), 'Unsupported platform: ' + this._platform);
  }

  /**
   * @return {string}
   */
  platform() {
    return this._platform;
  }

  /**
   * @param {string} revision
   * @return {!Promise<boolean>}
   */
  canDownload(revision, platform) {
    const url = downloadURL(platform || this._platform, this._downloadHost, revision);

    let resolve;
    const promise = new Promise((x) => (resolve = x));
    const request = httpRequest(url, 'HEAD', (response) => {
      resolve(response.statusCode === 200);
    });
    request.on('error', (error) => {
      console.error(error);
      resolve(false);
    });
    return promise;
  }

  /**
   * @param {string} revision
   * @param {?function(number, number)} progressCallback
   * @return {!Promise<!BrowserFetcher.RevisionInfo>}
   */
  async download(revision, progressCallback) {
    const url = downloadURL(this._platform, this._downloadHost, revision);
    const zipPath = path.join(this._downloadsFolder, `download-${this._platform}-${revision}.zip`);
    const folderPath = this._getFolderPath(revision);
    if (await existsAsync(folderPath)) {
      return this.revisionInfo(revision);
    }
    if (!(await existsAsync(this._downloadsFolder))) {
      await mkdirAsync(this._downloadsFolder);
    }
    try {
      await downloadFile(url, zipPath, progressCallback);
      await extractZip(zipPath, folderPath);
    } finally {
      if (await existsAsync(zipPath)) {
        await unlinkAsync(zipPath);
      }
    }
    const revisionInfo = this.revisionInfo(revision);
    if (revisionInfo) {
      await chmodAsync(revisionInfo.executablePath, 0o755);
    }
    return revisionInfo;
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
   * @param {string} revision
   * @return {!Promise}
   */
  async remove(revision) {
    const folderPath = this._getFolderPath(revision);
    assert(
      await existsAsync(folderPath),
      `Failed to remove: revision ${revision} is not downloaded`,
    );
    fs.removeSync(folderPath);
  }

  /**
   * @param {string} revision
   * @return {!BrowserFetcher.RevisionInfo}
   */
  revisionInfo(revision) {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._platform === 'mac') {
      executablePath = path.join(
        folderPath,
        archiveName(this._platform, revision),
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium',
      );
    } else if (this._platform === 'linux') {
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome');
    } else if (this._platform === 'win32' || this._platform === 'win64') {
      executablePath = path.join(folderPath, archiveName(this._platform, revision), 'chrome.exe');
    } else {
      throw 'Unsupported platform: ' + this._platform;
    }
    const url = downloadURL(this._platform, this._downloadHost, revision);
    const local = fs.existsSync(folderPath);
    return { revision, executablePath, folderPath, local, url };
  }

  _resolveExecutablePath() {
    const executablePath = process.env['TAIKO_BROWSER_PATH'];
    if (executablePath) {
      const missingText = !fs.existsSync(executablePath)
        ? 'Tried to use TAIKO_BROWSER_PATH env variable to launch browser but did not find any executable at: ' +
          executablePath
        : null;
      return { executablePath, missingText };
    }
    const revisionInfo = this.revisionInfo(preferredRevision);
    const missingText = !revisionInfo.local
      ? 'Chromium revision is not downloaded. Provide TAIKO_BROWSER_PATH or Install taiko again to download bundled chromium.'
      : null;
    return {
      executablePath: revisionInfo.executablePath,
      missingText,
    };
  }

  getExecutablePath() {
    const { missingText, executablePath } = this._resolveExecutablePath();
    if (missingText) {
      throw new Error(missingText);
    }
    return executablePath;
  }

  waitForWSEndpoint(chromeProcess, timeout) {
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: chromeProcess.stderr,
      });
      let stderr = '';
      const listeners = [
        helper.addEventListener(rl, 'line', onLine),
        helper.addEventListener(rl, 'close', () => onClose()),
        helper.addEventListener(chromeProcess, 'exit', () => onClose()),
        helper.addEventListener(chromeProcess, 'error', (error) => onClose(error)),
      ];
      const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

      /**
       * @param {!Error=} error
       */
      function onClose(error) {
        cleanup();
        reject(
          new Error(
            'Failed to launch chrome!' + (error ? ' ' + error.message : '') + '\n' + stderr,
          ),
        );
      }

      function onTimeout() {
        cleanup();
        reject(new Error(`Timed out after ${timeout} ms while trying to connect to Chrome!`));
      }

      /**
       * @param {string} line
       */
      function onLine(line) {
        stderr += line + '\n';
        const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
        if (!match) {
          return;
        }
        cleanup();
        const endpoint = {
          host: url.parse(match[1]).hostname,
          port: url.parse(match[1]).port,
          browser: url.parse(match[1]).href,
        };
        resolve(endpoint);
      }

      function cleanup() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        helper.removeEventListeners(listeners);
      }
    });
  }

  /**
   * @param {string} revision
   * @return {string}
   */
  _getFolderPath(revision) {
    return path.join(this._downloadsFolder, this._platform + '-' + revision);
  }
}

module.exports = BrowserFetcher;
module.exports.supportedPlatforms = supportedPlatforms;

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
 * @param {string} url
 * @param {string} destinationPath
 * @param {?function(number, number)} progressCallback
 * @return {!Promise}
 */
function downloadFile(url, destinationPath, progressCallback) {
  let fulfill, reject;
  let downloadedBytes = 0;
  let totalBytes = 0;

  const promise = new Promise((x, y) => {
    fulfill = x;
    reject = y;
  });

  const request = httpRequest(url, 'GET', (response) => {
    if (response.statusCode !== 200) {
      const error = new Error(
        `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
      );
      // consume response data to free up memory
      response.resume();
      reject(error);
      return;
    }
    const file = fs.createWriteStream(destinationPath);
    file.on('finish', () => fulfill());
    file.on('error', (error) => reject(error));
    response.pipe(file);
    totalBytes = parseInt(/** @type {string} */ (response.headers['content-length']), 10);
    if (progressCallback) {
      response.on('data', onData);
    }
  });
  request.on('error', (error) => reject(error));
  return promise;

  function onData(chunk) {
    downloadedBytes += chunk.length;
    progressCallback(downloadedBytes, totalBytes);
  }
}

/**
 * @param {string} zipPath
 * @param {string} folderPath
 * @return {!Promise<?Error>}
 */
function extractZip(zipPath, folderPath) {
  return new Promise((fulfill) => extract(zipPath, { dir: folderPath }, fulfill));
}

function httpRequest(url, method, response) {
  /** @type {Object} */
  const options = URL.parse(url);
  options.method = method;

  const proxyURL = getProxyForUrl(url);
  if (proxyURL) {
    /** @type {Object} */
    const parsedProxyURL = URL.parse(proxyURL);
    parsedProxyURL.secureProxy = parsedProxyURL.protocol === 'https:';

    options.agent = new ProxyAgent(parsedProxyURL);
    options.rejectUnauthorized = false;
  }

  const driver = options.protocol === 'https:' ? 'https' : 'http';
  const request = require(driver).request(options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      httpRequest(res.headers.location, method, response);
    } else {
      response(res);
    }
  });
  request.end();
  return request;
}

/**
 * @typedef {Object} BrowserFetcher.Options
 * @property {string=} platform
 * @property {string=} path
 * @property {string=} host
 */

/**
 * @typedef {Object} BrowserFetcher.RevisionInfo
 * @property {string} folderPath
 * @property {string} executablePath
 * @property {string} url
 * @property {boolean} local
 * @property {string} revision
 */
