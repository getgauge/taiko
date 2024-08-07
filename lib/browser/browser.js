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

const fs = require("fs-extra");
const { readdir, access, removeSync, existsSync } = fs;
const { join, basename } = require("node:path");
const { promisify } = require("node:util");
const { helper, assert } = require("../helper");
const { createInterface } = require("node:readline");
const { parse } = require("node:url");
const BrowserMetadata = require("./metadata");
const metadata = new BrowserMetadata();

const supportedPlatforms = ["mac-arm64", "mac-x64", "linux", "win32", "win64"];

const readdirAsync = promisify(readdir.bind(fs));

function existsAsync(filePath) {
  let fulfill = null;
  const promise = new Promise((x) => (fulfill = x));
  access(filePath, (err) => fulfill(!err));
  return promise;
}

class Browser {
  /**
   * @param {!Browser.Options=} options
   */
  constructor() {
    this._downloadsFolder = join(helper.projectRoot(), ".local-chromium");
    this._platform = metadata.platform();
    this.revisionInfo = metadata.revisionInfo();
  }

  /**
   * @return {string}
   */
  platform() {
    return this._platform;
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
    removeSync(folderPath);
  }

  _resolveExecutablePath() {
    const executablePath = process.env.TAIKO_BROWSER_PATH;
    if (executablePath) {
      const missingText = !existsSync(executablePath)
        ? `Tried to use TAIKO_BROWSER_PATH env variable to launch browser but did not find any executable at: ${executablePath}`
        : null;
      return { executablePath, missingText };
    }

    const metadata = require(join(helper.projectRoot(), "package.json"));

    if (!metadata.taiko) {
      return {
        executablePath,
        missingText:
          "Cannot find browser executable information in package.json, please set TAIKO_BROWSER_PATH env variable",
      };
    }

    const missingText = !this.revisionInfo.local
      ? "Chromium revision is not downloaded. Provide TAIKO_BROWSER_PATH or Install taiko again to download bundled chromium."
      : null;
    return {
      executablePath: this.revisionInfo.executablePath,
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

  waitForWSEndpoint(browserProcess, timeout) {
    return new Promise((resolve, reject) => {
      const rl = createInterface({
        input: browserProcess.stderr,
      });
      let stderr = "";
      const listeners = [
        helper.addEventListener(rl, "line", onLine),
        helper.addEventListener(rl, "close", () => onClose()),
        helper.addEventListener(browserProcess, "exit", () => onClose()),
        helper.addEventListener(browserProcess, "error", (error) =>
          onClose(error),
        ),
      ];
      const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

      /**
       * @param {!Error=} error
       */
      function onClose(error) {
        cleanup();
        reject(
          new Error(
            `Failed to launch browser!${error ? ` ${error.message}` : ""}\n${stderr}`,
          ),
        );
      }

      function onTimeout() {
        cleanup();
        reject(
          new Error(
            `Timed out after ${timeout} ms while trying to connect to Browser!`,
          ),
        );
      }

      /**
       * @param {string} line
       */
      function onLine(line) {
        stderr += `${line}\n`;
        const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
        if (!match) {
          return;
        }
        cleanup();
        const endpoint = {
          host: parse(match[1]).hostname,
          port: parse(match[1]).port,
          browser: parse(match[1]).href,
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
    return join(this._downloadsFolder, `${this._platform}-${revision}`);
  }
}

module.exports = Browser;

/**
 * @param {string} folderPath
 * @return {?{platform: string, revision: string}}
 */
function parseFolderPath(folderPath) {
  const name = basename(folderPath);
  const splits = name.split("-");
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
