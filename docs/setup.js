const fs = require('fs');
const mds = require('markdown-styles');
const { metadata } = require('../lib/taiko');

const content = `
title: Taiko
toc: ${JSON.stringify(metadata)}
---
` + fs.readFileSync('docs/index.md', 'utf-8');

fs.writeFileSync('docs/index.md', content, 'utf-8');
mds.render(mds.resolveArgs({
    input: 'docs/index.md',
    output: 'docs/site',
    layout: 'docs/layout'
}), function() {
    console.log('All done!');
});