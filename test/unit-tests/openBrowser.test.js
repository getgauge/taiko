let { openBrowser,closeBrowser } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe(' opens browser successfully',()=>{
    test('openBrowser successfully',  ()=>{
        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();

        return openBrowser(openBrowserArgs).then(data => {

            expect(data).toEqual({'description': 'Browser opened'});
        });
    });

    afterEach(async() => await closeBrowser(),10000);

});
