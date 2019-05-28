const fs = require('fs');
const getPlugins = () => {
    const taikoPlugin = process.env.TAIKO_PLUGIN;
    if (taikoPlugin) {
        return taikoPlugin
            .split(/\s*,\s*/)
            .map(plugin => plugin.match(/^taiko-.*/) ? plugin : `taiko-${plugin}`);
    }
    let data = fs.readFileSync('./package.json', 'utf-8');
    let packageJson = JSON.parse(data);
    let taikoPluginNames = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {})).
        filter(dependencies => dependencies.match(/^taiko-.*/));
    return taikoPluginNames;
};

module.exports = {
    getPlugins
};