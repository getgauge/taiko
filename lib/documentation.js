const { build } = require('documentation');
const { writeFileSync } = require('fs');
const { taikoInstallationLocation } = require('./util');

const keysToIgnore = [
  'lineNumber',
  'position',
  'code',
  'loc',
  'context',
  'path',
  'loose',
  'checked',
  'todos',
  'errors',
];

function removeLocation(comments) {
  const stringified = JSON.stringify(
    comments,
    (k, v) => {
      return keysToIgnore.includes(k) ? void 0 : v;
    },
    0,
  );
  return stringified;
}

async function updateDoc() {
  const comments = await build('./lib/taiko.js', { shallow: true });
  const jsonDocString = removeLocation(comments);
  writeFileSync('./lib/api.json', jsonDocString);
}

const main = async () => {
  try {
    await updateDoc();
  } catch (error) {
    let local = taikoInstallationLocation();
    console.warn(
      `\x1b[33mCould not generate API documentation.Run <node lib/documentation.js> in the directory ${local}.`,
    );
  }
};
if (!process.env.TAIKO_SKIP_DOCUMENTATION) {
  main();
}
