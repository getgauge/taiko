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

const fs = require('fs-extra');
const path = require('path');
const extract = require('extract-zip');
const util = require('util');
const URL = require('url');
const { helper, assert } = require('../helper');
const ProxyAgent = require('https-proxy-agent');
const getProxyForUrl = require('proxy-from-env').getProxyForUrl;

const mkdirAsync = util.promisify(fs.mkdir.bind(fs));
const unlinkAsync = util.promisify(fs.unlink.bind(fs));
const chmodAsync = util.promisify(fs.chmod.bind(fs));
const BrowserMetadata = require('./metadata');
const metadata = new BrowserMetadata();

function existsAsync(filePath) {
  let fulfill = null;
  const promise = new Promise((x) => (fulfill = x));
  fs.access(filePath, (err) => fulfill(!err));
  return promise;
}

class BrowserFetcher {
  constructor(options = {}) {
    this._downloadsFolder = options.path || path.join(helper.projectRoot(), '.local-chromium');
    this._platform = options.platform || metadata.platform();
    this.downloadURL = metadata.downloadURL;
    this.revisionInfo = metadata.revisionInfo();
  }

  /**
   * @return {string}
   */
  platform() {
    return this._platform;
  }

  /**
   * @return {!Promise<boolean>}
   */
  canDownload() {
    let resolve;
    const promise = new Promise((x) => (resolve = x));
    const request = httpRequest(this.downloadURL, 'HEAD', (response) => {
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
   * @return {!Promise<!BrowserMetadata.RevisionInfo>}
   */
  async download(revision, progressCallback) {
    const zipPath = path.join(this._downloadsFolder, `download-${this._platform}-${revision}.zip`);
    const folderPath = this._getFolderPath(revision);
    if (await existsAsync(folderPath)) {
      return this.revisionInfo;
    }
    if (!(await existsAsync(this._downloadsFolder))) {
      await mkdirAsync(this._downloadsFolder);
    }
    try {
      await downloadFile(this.downloadURL, zipPath, progressCallback);
      await extractZip(zipPath, folderPath);
    } finally {
      if (await existsAsync(zipPath)) {
        await unlinkAsync(zipPath);
      }
    }
    const revisionInfo = this.revisionInfo;
    if (revisionInfo) {
      await chmodAsync(revisionInfo.executablePath, 0o755);
    }
    return revisionInfo;
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
   * @return {string}
   */
  _getFolderPath(revision) {
    return path.join(this._downloadsFolder, this._platform + '-' + revision);
  }
}

module.exports = BrowserFetcher;

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
