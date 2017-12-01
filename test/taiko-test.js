const assert = require('assert');
const taiko = require('../lib/taiko');

it('All the exported functions are present in metadata', function() {
    const allFuncs = Object.keys(taiko);
    const funcsInMetadata = [].concat.apply(['metadata'], Object.values(taiko.metadata));

    assert.deepEqual(allFuncs.sort(), funcsInMetadata.sort());
});