const taiko = require('./lib/taiko');

taiko.openBrowser(new Map()).then(() => console.log('Done')).catch(e => console.log(e)).then(() => taiko.closeBrowser())