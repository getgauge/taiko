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

const fs = require("fs-extra");
const path = require("node:path");
const AdmZip = require("adm-zip");
const util = require("node:util");

const unlinkAsync = util.promisify(fs.unlink.bind(fs));
const symlinkAsync = util.promisify(fs.symlink.bind(fs));

/**
 * @param {string} zipPath
 * @param {string} folderPath
 * @return {!Promise<?Error>}
 */
async function extractZip(zipPath, folderPath) {
  const archive = new AdmZip(zipPath);
  archive.extractAllTo(folderPath, true, true);

  for (const entry of archive.getEntries()) {
    const mode = (entry.attr >>> 16) & 0xffff;
    const isSymlink = (mode & 0xf000) === 0xa000;
    if (!isSymlink) {
      continue;
    }

    const linkPath = path.resolve(folderPath, entry.entryName);
    const linkTarget = entry.getData().toString();
    const resolvedTarget = path.resolve(path.dirname(linkPath), linkTarget);
    if (
      !isPathInside(folderPath, linkPath) ||
      !isPathInside(folderPath, resolvedTarget)
    ) {
      throw new Error(`Unsafe symlink in browser archive: ${entry.entryName}`);
    }

    await unlinkAsync(linkPath);
    await symlinkAsync(linkTarget, linkPath);
  }
}

function isPathInside(parentPath, childPath) {
  const relativePath = path.relative(path.resolve(parentPath), childPath);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

module.exports = extractZip;
