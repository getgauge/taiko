const expect = require("chai").expect;
const rewire = require("rewire");
const path = require("node:path");
const os = require("node:os");

describe("Plugins", () => {
  let PLUGINS;
  before(() => {
    PLUGINS = rewire("../../lib/plugins");
  });
  after(() => {
    PLUGINS = rewire("../../lib/plugins");
  });
  describe("GetPlugins", () => {
    function mockReadFileSyncWith(content) {
      const fsMock = {
        readFileSync: () => content,
        existsSync: () => true,
      };
      PLUGINS.__set__("fs", fsMock);
    }
    describe("With ENV variable", () => {
      afterEach(() => {
        delete process.env.TAIKO_PLUGIN;
      });
      it("should give plugin name from ENV variable", () => {
        process.env.TAIKO_PLUGIN = "some-plugin";
        expect(PLUGINS.getPlugins()).to.deep.equal(["taiko-some-plugin"]);
      });

      it("should give plugin names from ENV variable", () => {
        process.env.TAIKO_PLUGIN = "plugin-1 ,plugin-2, plugin-3";
        expect(PLUGINS.getPlugins()).to.deep.equal([
          "taiko-plugin-1",
          "taiko-plugin-2",
          "taiko-plugin-3",
        ]);
      });
    });

    describe("Get plugins from package.json", () => {
      it("should give empty array if there is no package.json", () => {
        const fsMock = {
          existsSync: () => false,
        };
        PLUGINS.__set__("fs", fsMock);
        expect(PLUGINS.getPlugins()).to.deep.equal([]);
      });

      it("should give plugin name from dependencies", () => {
        mockReadFileSyncWith(`{
                "dependencies": {
                    "taiko-dep-plugin-1": "v2.4.5",
                    "taiko-dep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
        expect(PLUGINS.getPlugins()).to.deep.equal([
          "taiko-dep-plugin-1",
          "taiko-dep-plugin-2",
        ]);
      });

      it("should give plugin name from devDependencies", () => {
        mockReadFileSyncWith(`{
                "devDependencies": {
                    "taiko-devDep-plugin-1": "v2.4.5",
                    "taiko-devDep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
        expect(PLUGINS.getPlugins()).to.deep.equal([
          "taiko-devDep-plugin-1",
          "taiko-devDep-plugin-2",
        ]);
      });

      it("should give plugin name from both devDependencies and dependencies", () => {
        mockReadFileSyncWith(`{
                "dependencies": {
                    "taiko-dep-plugin-1": "v2.4.5",
                    "taiko-dep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                },
                "devDependencies": {
                    "taiko-devDep-plugin-1": "v2.4.5",
                    "taiko-devDep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
        const expectedPluginNames = [
          "taiko-dep-plugin-1",
          "taiko-dep-plugin-2",
          "taiko-devDep-plugin-1",
          "taiko-devDep-plugin-2",
        ];
        expect(PLUGINS.getPlugins()).to.deep.equal(expectedPluginNames);
      });
    });
  });

  describe("RegisterHooks", () => {
    it("should define a const with available hooks", () => {
      const expectedHooks = ["preConnectionHook"];
      expect(expectedHooks).to.deep.equal(Object.keys(PLUGINS.pluginHooks));
    });
    it("should let plugins register to available hooks", () => {
      const expectedResult = "Value from hook";
      PLUGINS.registerHooks({ preConnectionHook: () => expectedResult });
      const actualResult = PLUGINS.pluginHooks.preConnectionHook();
      expect(actualResult).to.equal(expectedResult);
    });
    it("should throw error if plugins try to register unavailable hook", () => {
      expect(() => {
        PLUGINS.registerHooks({ nonAvailableHook: () => {} });
      }).to.throw("Hook nonAvailableHook not available in taiko to register");
    });
  });

  describe("GetExecutablePlugin", () => {
    function createFakeFsDirentObj(isDir, isSymLink) {
      return {
        isSymbolicLink: () => isSymLink,
        isDirectory: () => isDir,
      };
    }
    it("should give all globally installed executable taiko-plugin and there path", () => {
      const tmpDir = os.tmpdir();
      const simlinkedPath = path.join(tmpDir, "taiko-plugin-simlinked-path");
      const globalPluginPath = path.join(tmpDir, "global", "taiko-plugin-path");
      const localPluginPath = path.join(tmpDir, "local", "taiko-plugin-path");
      const fsMock = {
        existsSync: () => true,
        readdirSync: (path) => {
          if (path === globalPluginPath) {
            return [
              "taiko-global-plugin1",
              "taiko-plugin2",
              "taiko-plugin3",
              "tmpdir",
              "taiko-global-plugin4",
              "taiko-dup-plugin1",
            ];
          }
          return [
            "taiko-plugin1",
            "taiko-plugin2",
            "taiko-plugin3",
            "tmpdir",
            "taiko-plugin4",
            "taiko-dup-plugin1",
          ];
        },
        statSync: (nodeModulePath) => {
          const foo = {
            [path.join(globalPluginPath, "taiko-global-plugin1")]:
              createFakeFsDirentObj(true, false),
            [path.join(globalPluginPath, "taiko-plugin2")]:
              createFakeFsDirentObj(true, false),
            [path.join(globalPluginPath, "taiko-plugin3")]:
              createFakeFsDirentObj(false, false),
            [path.join(globalPluginPath, "tmpdir")]: createFakeFsDirentObj(
              true,
              false,
            ),
            [path.join(globalPluginPath, "taiko-global-plugin4")]:
              createFakeFsDirentObj(false, true),
            [path.join(globalPluginPath, "taiko-dup-plugin1")]:
              createFakeFsDirentObj(true, false),
            [path.join(localPluginPath, "taiko-plugin1")]:
              createFakeFsDirentObj(true, false),
            [path.join(localPluginPath, "taiko-plugin2")]:
              createFakeFsDirentObj(true, false),
            [path.join(localPluginPath, "taiko-plugin3")]:
              createFakeFsDirentObj(false, false),
            [path.join(localPluginPath, "tmpdir")]: createFakeFsDirentObj(
              true,
              false,
            ),
            [path.join(localPluginPath, "taiko-plugin4")]:
              createFakeFsDirentObj(false, true),
            [path.join(localPluginPath, "taiko-dup-plugin1")]:
              createFakeFsDirentObj(true, false),
            [simlinkedPath]: createFakeFsDirentObj(true, false),
          };
          return foo[nodeModulePath];
        },
        readlinkSync: () => {
          return simlinkedPath;
        },
      };
      PLUGINS.__set__("childProcess", {
        spawnSync: (...args) => {
          if (args[1][1] === "-g") {
            return { stdout: globalPluginPath };
          }
          return { stdout: localPluginPath };
        },
      });
      PLUGINS.__set__("fs", fsMock);
      PLUGINS.__set__("getPackageJsonForPlugin", (pluginPath, plugin) => {
        if (
          [
            "taiko-global-plugin1",
            "taiko-global-plugin4",
            "taiko-plugin1",
            "taiko-plugin4",
            "taiko-dup-plugin1",
          ].includes(plugin)
        ) {
          return { capability: ["subcommands"] };
        } else if (plugin === "taiko-plugin2") {
          return { capability: [] };
        } else {
          return {};
        }
      });

      const expected = {
        "global-plugin1": path.join(globalPluginPath, "taiko-global-plugin1"),
        "global-plugin4": path.join(globalPluginPath, "taiko-global-plugin4"),
        plugin1: path.join(localPluginPath, "taiko-plugin1"),
        plugin4: path.join(localPluginPath, "taiko-plugin4"),
        "dup-plugin1": path.join(localPluginPath, "taiko-dup-plugin1"),
      };
      expect(PLUGINS.getExecutablePlugins()).to.be.deep.equal(expected);
    });
  });
});
