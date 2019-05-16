const fs = require('fs');
let data = fs.readFileSync('./package.json', 'utf-8');
let packageJson = JSON.parse(data);
exports.packageJson = packageJson;

const getPlugins = () => {
    let data = fs.readFileSync('./package.json', 'utf-8');
    let packageJson = JSON.parse(data);
    let taikoPluginNames = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {})).filter( dependencies => dependencies.match(/^taiko-.*/));
    return taikoPluginNames;
};

module.exports = {
    getPlugins
};