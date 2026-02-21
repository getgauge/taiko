const fs = require("node:fs");
const childProcess = require("node:child_process");
const path = require("node:path");

const pluginHooks = {
  preConnectionHook: (target, options) => {
    return { target, options };
  },
};

const registerHooks = (hooks) => {
  for (const hook in hooks) {
    if (!Object.hasOwn(pluginHooks, hook)) {
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
      .map((plugin) =>
        plugin.match(/^taiko-.*/) ? plugin : `taiko-${plugin}`,
      );
  }
  if (!fs.existsSync("./package.json")) {
    return [];
  }
  const data = fs.readFileSync("./package.json", "utf-8");
  const packageJson = JSON.parse(data);
  const taikoPluginNames = Object.keys(packageJson.dependencies || {})
    .concat(Object.keys(packageJson.devDependencies || {}))
    .filter((dependencies) => dependencies.match(/^taiko-.*/));
  return taikoPluginNames;
};

const getExecutablePlugins = () => {
  const pluginsGlobalPath = childProcess
    .spawnSync("npm", ["root", "-g"], { shell: true })
    .stdout.toString()
    .trim();
  const pluginsLocalPath = childProcess
    .spawnSync("npm", ["root"], { shell: true })
    .stdout.toString()
    .trim();
  const globalPlugins = getPluginsInstalledOn(pluginsGlobalPath);
  const localPlugins = getPluginsInstalledOn(pluginsLocalPath);
  const globalExecutablePlugin = filterExecutablePlugin(
    globalPlugins,
    pluginsGlobalPath,
  );
  const localExecutablePlugin = filterExecutablePlugin(
    localPlugins,
    pluginsLocalPath,
  );

  return Object.keys(globalExecutablePlugin).reduce(
    (localPlugins, globalPlugin) => {
      if (!Object.hasOwn(localPlugins, globalPlugin)) {
        localPlugins[globalPlugin] = globalExecutablePlugin[globalPlugin];
      }
      return localPlugins;
    },
    localExecutablePlugin,
  );
};

function getPluginsInstalledOn(pluginsPath) {
  if (!fs.existsSync(pluginsPath)) {
    return [];
  }
  return fs.readdirSync(pluginsPath).filter((file) => {
    const npmModule = fs.statSync(path.join(pluginsPath, file));
    if (npmModule.isSymbolicLink()) {
      const fsStat = fs.statSync(
        path.resolve(
          pluginsPath,
          fs.readlinkSync(path.resolve(pluginsPath, file)),
        ),
      );
      return fsStat.isDirectory() && file.match(/^taiko-.*/);
    }
    return npmModule.isDirectory() && file.match(/^taiko-.*/);
  });
}

function filterExecutablePlugin(plugins, pluginsPath) {
  return plugins
    .filter((npmModule) => {
      const packageJson = getPackageJsonForPlugin(pluginsPath, npmModule);
      return packageJson.capability?.includes("subcommands");
    })
    .reduce((plugins, plugin) => {
      plugins[plugin.replace(/^taiko-/, "")] = path.join(pluginsPath, plugin);
      return plugins;
    }, {});
}

function getPackageJsonForPlugin(pluginsPath, plugin) {
  return require(path.resolve(pluginsPath, plugin, "package.json"));
}
module.exports = {
  getPlugins,
  getExecutablePlugins,
  pluginHooks,
  registerHooks,
};
