const fs = require('fs');
const mds = require('markdown-styles');
const { metadata } = require('../lib/taiko');

const content = `
title: Taiko
toc: ${JSON.stringify(metadata)}
---
` + fs.readFileSync('docs/index.md', 'utf-8');
fs.writeFileSync('docs/index.md', content, 'utf-8');

function generateDoc(layout) {
    mds.render(mds.resolveArgs({
        input: 'docs/index.md',
        output: 'docs/site',
        layout: layout,
    }), function () {
        console.log('All done!');
    });
}

function main(arg) {
    if (arg === '--new') {
        generateDoc('docs/layout');
    }else{
        generateDoc('docs/layoutOld');
    }
}

main(process.argv[2]);