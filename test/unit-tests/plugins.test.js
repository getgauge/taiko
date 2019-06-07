const expect = require('chai').expect;
const rewire = require('rewire');
const PLUGINS = rewire('../../lib/plugins');

describe('Plugins', () => {
    describe('GetPlugins', () => {
        function mockReadFileSyncWith(content) {
            var fsMock = {
                readFileSync: function () {
                    return content;
                },
                existsSync: function () {
                    return true;
                }
            };
            PLUGINS.__set__('fs', fsMock);
        }
        describe('With ENV variable', () => {
            afterEach(() => {
                delete process.env.TAIKO_PLUGIN;
            });
            it('should give plugin name from ENV variable', () => {
                process.env.TAIKO_PLUGIN = 'some-plugin';
                expect(PLUGINS.getPlugins()).to.deep.equal(['taiko-some-plugin']);
            });

            it('should give plugin names from ENV variable', () => {
                process.env.TAIKO_PLUGIN = 'plugin-1 ,plugin-2, plugin-3';
                expect(PLUGINS.getPlugins()).to.deep.equal(['taiko-plugin-1', 'taiko-plugin-2', 'taiko-plugin-3']);
            });
        });

        describe('Get plugins from package.json', () => {

            it('should give empty array if there is no package.json', () => {
                var fsMock = {
                    existsSync: function () {
                        return false;
                    }
                };
                PLUGINS.__set__('fs', fsMock);
                expect(PLUGINS.getPlugins()).to.deep.equal([]);
            });

            it('should give plugin name from dependencies', () => {
                mockReadFileSyncWith(`{
                "dependencies": {
                    "taiko-dep-plugin-1": "v2.4.5",
                    "taiko-dep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
                expect(PLUGINS.getPlugins()).to.deep.equal(['taiko-dep-plugin-1', 'taiko-dep-plugin-2']);
            });

            it('should give plugin name from devDependencies', () => {
                mockReadFileSyncWith(`{
                "devDependencies": {
                    "taiko-devDep-plugin-1": "v2.4.5",
                    "taiko-devDep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
                expect(PLUGINS.getPlugins()).to.deep.equal(['taiko-devDep-plugin-1', 'taiko-devDep-plugin-2']);
            });

            it('should give plugin name from both devDependencies and dependencies', () => {
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
                const expectedPluginNames = ['taiko-dep-plugin-1', 'taiko-dep-plugin-2', 'taiko-devDep-plugin-1', 'taiko-devDep-plugin-2'];
                expect(PLUGINS.getPlugins()).to.deep.equal(expectedPluginNames);
            });
        });
    });

    describe('GetExecutablePlugin', () => {
        function createFakeFsDirentObj(name, isDir, isSymLink) {
            return {
                name: name,
                isSymbolicLink: () => isSymLink,
                isDirectory: () => isDir
            };
        }
        it('should give all globally installed executable taiko-plugin and there path', () => {
            var fsMock = {
                existsSync: function () {
                    return true;
                },
                readdirSync: function (path) {
                    if (path === '/tmp/global/taiko-plugin-path')
                        return [
                            createFakeFsDirentObj('taiko-global-plugin1', true, false),
                            createFakeFsDirentObj('taiko-plugin2', true, false),
                            createFakeFsDirentObj('taiko-plugin3', false, false),
                            createFakeFsDirentObj('tmpdir', true, false),
                            createFakeFsDirentObj('taiko-global-plugin4', false, true),
                            createFakeFsDirentObj('taiko-dup-plugin1', true, false)
                        ];
                    return [
                        createFakeFsDirentObj('taiko-plugin1', true, false),
                        createFakeFsDirentObj('taiko-plugin2', true, false),
                        createFakeFsDirentObj('taiko-plugin3', false, false),
                        createFakeFsDirentObj('tmpdir', true, false),
                        createFakeFsDirentObj('taiko-plugin4', false, true),
                        createFakeFsDirentObj('taiko-dup-plugin1', true, false)
                    ];
                },
                statSync: function () {
                    return { isDirectory: () => true };
                },
                readlinkSync: () => {
                    return '/tmp/taiko-plugin-simlinked-path';
                }
            };
            PLUGINS.__set__('childProcess', {
                spawnSync: (...args) => {
                    if (args[1][1] === '-g')
                        return { stdout: '/tmp/global/taiko-plugin-path' };
                    return { stdout: '/tmp/local/taiko-plugin-path' };
                }
            });
            PLUGINS.__set__('fs', fsMock);
            PLUGINS.__set__('getPackageJsonForPlugin', (pluginPath, plugin) => {
                if (['taiko-global-plugin1', 'taiko-global-plugin4', 'taiko-plugin1', 'taiko-plugin4', 'taiko-dup-plugin1'].includes(plugin)) {
                    return { capability: ['subcommands'] };
                } else if (plugin === 'taiko-plugin2') {
                    return { capability: [] };
                } else {
                    return {};
                }
            });

            const expected = {
                'global-plugin1': '/tmp/global/taiko-plugin-path/taiko-global-plugin1',
                'global-plugin4': '/tmp/global/taiko-plugin-path/taiko-global-plugin4',
                'plugin1': '/tmp/local/taiko-plugin-path/taiko-plugin1',
                'plugin4': '/tmp/local/taiko-plugin-path/taiko-plugin4',
                'dup-plugin1': '/tmp/local/taiko-plugin-path/taiko-dup-plugin1'
            };
            expect(PLUGINS.getExecutablePlugins()).to.be.deep.equal(expected);
        });
    });
});