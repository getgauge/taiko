import { openBrowser, closeBrowser } from '../../taiko';

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
