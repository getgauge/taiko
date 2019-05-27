const fs = require('fs');

const addTagToDocSearch = function () {
    let tag = process.env.TAG || 'preview';
    let tmpl = fs.readFileSync('docs/layout/assets/tmpl/docSearch.tmpl', 'utf-8');
    let contents  = tmpl.replace('$tag', tag);
    fs.writeFileSync('docs/layout/assets/js/docSearch.js', contents);

};

addTagToDocSearch();

