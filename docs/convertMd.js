const marked = require('marked');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { metadata } = require('../lib/taiko');

// const content = `
// title: Taiko
// toc: ${JSON.stringify(metadata)}
// ---
// ` + fs.readFileSync('docs/index.md', 'utf-8');
// fs.writeFileSync('docs/index.md', content, 'utf-8');


var renderer = new marked.Renderer();

renderer.link = function(href, title, text) {
    if (this.options.sanitize) {
        try {
            var prot = decodeURIComponent(unescape(href))
                .replace(/[^\w:]/g, '')
                .toLowerCase();
        } catch (e) {
            return '';
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
            return '';
        }
    }
    
    var out = '<a href="' + href + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    out += '>' + text + '</a>';
    return out;
};

fs.readFile('docs/index.md', 'utf8', function(err, data) {
    fs.writeFileSync('docs/layout/partials/content.html', marked(data, { renderer: renderer }), 'utf-8');
});

fs.readdirSync('docs/layout/partials').forEach(file => {
    var partialName = path.basename(file, path.extname(file));
    handlebars.registerPartial(partialName, fs.readFileSync('docs/layout/partials/'+file, 'utf8'));
});

handlebars.registerHelper('lowerCase', require('./layout/helpers/lowerCase'));

var template = handlebars.compile(fs.readFileSync('docs/layout/page.html', 'utf8'));
var html    = template({toc:metadata});

console.log(html);
