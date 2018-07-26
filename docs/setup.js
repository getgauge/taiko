const fs = require('fs');
const mds = require('markdown-styles');
const { metadata } = require('../lib/taiko');

mds.render(mds.resolveArgs({
    input: 'docs/api.md',
    output: 'docs/site',
    layout: 'docs/layout',
}), function() {
    fs.copyFileSync('docs/index.html', 'docs/site/index.html')
    console.log('All done!');
});