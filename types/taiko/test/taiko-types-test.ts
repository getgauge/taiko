import { openBrowser, closeBrowser, switchTo } from '../../taiko';

// ------------------------------------------
// openBrowser
// https://docs.taiko.dev/api/openbrowser
// ------------------------------------------

openBrowser(); // $ExpectType Promise<void>
openBrowser({ headless: false }); // $ExpectType Promise<void>
openBrowser({ args: ['--window-size=1440,900'] }); // $ExpectType Promise<void>

// $ExpectType Promise<void>
openBrowser({
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
  ],
});

// ------------------------------------------
// closeBrowser
// https://docs.taiko.dev/api/closebrowser
// ------------------------------------------

closeBrowser(); // $ExpectType Promise<void>
closeBrowser({}); // $ExpectError

// ------------------------------------------
// switchTo
// https://docs.taiko.dev/api/switchTo
// ------------------------------------------

switchTo(/taiko.dev/); // $ExpectType Promise<void>
switchTo(/Taiko/); // $ExpectType Promise<void>
switchTo(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/); // $ExpectType Promise<void>
switchTo(/Go*gle/); // $ExpectType Promise<void>
switchTo(/google.com/); // $ExpectType Promise<void>
switchTo({ name: 'newyorktimes' }); // $ExpectType Promise<void>
