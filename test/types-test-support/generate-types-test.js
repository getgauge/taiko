const taiko = require('../../lib/taiko');
const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * This writes a TS file that simply instantiates every function exported by taiko.
 * Then it is possible to dtslint that file and see if any exported function lacks
 * a type definition in index.d.ts.
 */
(async () => {
  const BASE_DIR = './types/taiko/test/generated';
  const FILENAME = 'generated-type-test.ts';
  const filePath = path.join(BASE_DIR, FILENAME);

  async function writeTestFileContent(funcs, stream) {
    await stream.write("import * as taiko from '../../../taiko';\n\n");
    funcs.sort().forEach(async (item) => await stream.write(`taiko.${item};\n`));
  }

  try {
    const allExportedFuncs = Object.keys(taiko).filter(
      (item) => item !== 'emitter' && item !== 'metadata',
    );

    await util.promisify(fs.mkdir)(BASE_DIR, { recursive: true });
    const writeStream = fs.createWriteStream(filePath);
    await writeTestFileContent(allExportedFuncs, writeStream);
    writeStream.close();
    return filePath;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})().then((filePath) => console.log('Generated ' + filePath));
