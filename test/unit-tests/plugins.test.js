const expect = require('chai').expect;
const rewire = require('rewire');
const PLUGINS = rewire('../../lib/plugins');

function mockReadFileSyncWith (content) {
    var fsMock = {
        readFileSync: function ( ) {
            return content;
        }
    };
    PLUGINS.__set__('fs', fsMock);
}

describe('GetPlugins', () => {
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