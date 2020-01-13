const marked = require('marked');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const { metadata } = require('../lib/taiko');

const createDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

createDir('docs/site/');
createDir('docs/site/assets');
console.log('Copying assets...');
fs.copySync('docs/layout/assets', 'docs/site/assets');

console.log('Converting markdown to partial...');
var renderer = new marked.Renderer();
fs.writeFileSync(
  'docs/layout/partials/content.html',
  marked(fs.readFileSync('docs/index.md', 'utf8'), {
    renderer: renderer,
  }),
  'utf-8',
);

console.log('Compiling partials to site...');
fs.readdirSync('docs/layout/partials').forEach(file => {
  var partialName = path.basename(file, path.extname(file));
  handlebars.registerPartial(partialName, fs.readFileSync('docs/layout/partials/' + file, 'utf8'));
});
handlebars.registerHelper('lowerCase', require('./layout/helpers/lowerCase'));

var template = handlebars.compile(fs.readFileSync('docs/layout/page.html', 'utf8'));
var html = template({
  toc: metadata,
  title: 'Taiko, free and open source browser automation',
});

console.log('Writing to index.html...');
fs.writeFileSync('docs/site/index.html', html, 'utf8');
