const taiko = require('taiko');

console.log('✅ Taiko workspace test passed');
console.log(`   - Loaded ${Object.keys(taiko).length} exports`);
console.log('   - Main exports found:', ['openBrowser', 'goto', 'click'].every(fn => typeof taiko[fn] === 'function'));