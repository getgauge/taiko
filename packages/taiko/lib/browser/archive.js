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
