const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');

const pluginHooks = {
  preConnectionHook: (target, options) => {
    return { target, options };
  },
};

const registerHooks = (hooks) => {
  for (let hook in hooks) {
    if (!Object.prototype.hasOwnProperty.call(pluginHooks, hook)) {
      throw new Error(`Hook ${hook} not available in taiko to register`);
    }
    pluginHooks[hook] = hooks[hook];
  }
};

const getPlugins = () => {
  const taikoPlugin = process.env.TAIKO_PLUGIN;
  if (taikoPlugin) {
    return taikoPlugin
      .split(/\s*,\s*/)
      .map((plugin) => (plugin.match(/^taiko-.*/) ? plugin : `taiko-${plugin}`));
  }
  if (!fs.existsSync('./package.json')) {
    return [];
  }
  let data = fs.readFileSync('./package.json', 'utf-8');
  let packageJson = JSON.parse(data);
  let taikoPluginNames = Object.keys(packageJson.dependencies || {})
    .concat(Object.keys(packageJson.devDependencies || {}))
    .filter((dependencies) => dependencies.match(/^taiko-.*/));
  return taikoPluginNames;
};

const getExecutablePlugins = () => {
  let pluginsGlobalPath = childProcess
    .spawnSync('npm', ['root', '-g'], { shell: true })
    .stdout.toString()
    .trim();
  let pluginsLocalPath = childProcess
    .spawnSync('npm', ['root'], { shell: true })
    .stdout.toString()
    .trim();
  let globalPlugins = getPluginsInstalledOn(pluginsGlobalPath);
  let localPlugins = getPluginsInstalledOn(pluginsLocalPath);
  let globalExecutablePlugin = filterExecutablePlugin(globalPlugins, pluginsGlobalPath);
  let localExecutablePlugin = filterExecutablePlugin(localPlugins, pluginsLocalPath);

  return Object.keys(globalExecutablePlugin).reduce((localPlugins, globalPlugin) => {
    if (!Object.prototype.hasOwnProperty.call(localPlugins, globalPlugin)) {
      localPlugins[globalPlugin] = globalExecutablePlugin[globalPlugin];
    }
    return localPlugins;
  }, localExecutablePlugin);
};

function getPluginsInstalledOn(pluginsPath) {
  if (!fs.existsSync(pluginsPath)) {
    return [];
  }
  return fs.readdirSync(pluginsPath).filter((file) => {
    let npmModule = fs.statSync(path.join(pluginsPath, file));
    if (npmModule.isSymbolicLink()) {
      let fsStat = fs.statSync(
        path.resolve(pluginsPath, fs.readlinkSync(path.resolve(pluginsPath, file))),
      );
      return fsStat.isDirectory() && file.match(/^taiko-.*/);
    }
    return npmModule.isDirectory() && file.match(/^taiko-.*/);
  });
}

function filterExecutablePlugin(plugins, pluginsPath) {
  return plugins
    .filter((npmModule) => {
      let packageJson = getPackageJsonForPlugin(pluginsPath, npmModule);
      return packageJson.capability && packageJson.capability.includes('subcommands');
    })
    .reduce((plugins, plugin) => {
      plugins[plugin.replace(/^taiko-/, '')] = path.join(pluginsPath, plugin);
      return plugins;
    }, {});
}

function getPackageJsonForPlugin(pluginsPath, plugin) {
  return require(path.resolve(pluginsPath, plugin, 'package.json'));
}
module.exports = {
  getPlugins,
  getExecutablePlugins,
  pluginHooks,
  registerHooks,
};
