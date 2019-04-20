let { openBrowser,closeBrowser } = require('../../lib/taiko');

describe(' opens browser successfully',()=>{
    test('openBrowser successfully',  ()=>{
        expect(process.env.TAIKO_EMULATE_DEVICE).not.toBeDefined();

        return openBrowser({headless:false}).then(data => {

            expect(data).toEqual({'description': 'Browser opened'});
        });
    });

    afterEach(async() => await closeBrowser());

});
