const fs = require('fs');
const { getPlugins } = require('../../lib/plugins');
jest.mock('fs');
describe('GetPlugins', () => {
    describe('With ENV variable', () => {
        afterEach(() => {
            delete process.env.TAIKO_PLUGIN;
        });
        test('should give plugin name from ENV variable', () => {
            process.env.TAIKO_PLUGIN = 'some-plugin';
            expect(getPlugins()).toEqual(['taiko-some-plugin']);
        });

        test('should give plugin names from ENV variable', () => {
            process.env.TAIKO_PLUGIN = 'plugin-1 ,plugin-2, plugin-3';
            expect(getPlugins()).toEqual(['taiko-plugin-1', 'taiko-plugin-2', 'taiko-plugin-3']);
        });
    });

    describe('Get plugins from package.json', () => {
        test('should give plugin name from dependencies', () => {
            fs.readFileSync.mockReturnValue(`{
                "dependencies": {
                    "taiko-dep-plugin-1": "v2.4.5",
                    "taiko-dep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
            expect(getPlugins()).toEqual(['taiko-dep-plugin-1', 'taiko-dep-plugin-2']);
        });

        test('should give plugin name from devDependencies', () => {
            fs.readFileSync.mockReturnValue(`{
                "devDependencies": {
                    "taiko-devDep-plugin-1": "v2.4.5",
                    "taiko-devDep-plugin-2": "v1.4.5",
                    "some-other-module" : "v1.0.1"
                }
            }`);
            expect(getPlugins()).toEqual(['taiko-devDep-plugin-1', 'taiko-devDep-plugin-2']);
        });

        test('should give plugin name from both devDependencies and dependencies', () => {
            fs.readFileSync.mockReturnValue(`{
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
            expect(getPlugins()).toEqual(expectedPluginNames);
        });
    });
});