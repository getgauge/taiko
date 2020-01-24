const { build } = require('documentation');
const { writeFileSync } = require('fs');

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
  console.log('Successfully save json docs to lib/api.json.');
}

const main = async () => {
  try {
    await updateDoc();
  } catch (error) {
    console.error(`Failed to generate api.json file. Reason :${error.message}`);
  }
};
main();
