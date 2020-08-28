import { openBrowser, closeBrowser, switchTo, intercept } from '../../taiko';

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

// ------------------------------------------
// intercept
// https://docs.taiko.dev/api/intercept
// ------------------------------------------

// Case 1: Block URL (Blocks all request for people.png)
// $ExpectType Promise<void>
intercept('http://localhost:3000/assets/images/people.png');

// Case 2: Mock response (Mocks response to modify address from "888 Central St." to "12345 Central St." )
// $ExpectType Promise<void>
intercept('http://localhost:3000/api/customers/11', {
  body:
    '{"id":11,"firstName":"ward","lastName":"bell","gender":"male",' +
    '"address":"12345 Central St.","city":"Los Angeles",' +
    '"state":{"abbreviation":"CA","name":"California"},' +
    '"latitude":34.042552,"longitude":-118.266429}',
});

// Case 3: Override request (Overrides google4_hdpi.png url to return female.png can be seen in map)
// $ExpectType Promise<void>
intercept('https://maps.gstatic.com/mapfiles/api-3/images/google4_hdpi.png', (request) => {
  request.continue({ url: 'http://localhost:3000/assets/images/female.png' });
});

// Case 4: Redirect URL (Overrides male.png to female.png)
// $ExpectType Promise<void>
intercept(
  'http://localhost:3000/assets/images/male.png',
  'http://localhost:3000/assets/images/female.png',
);

// Case 5: Mock response based on request (Mocks response to modify address from "1234 Anywhere St." to "888 Anywhere St.")
// $ExpectType Promise<void>
intercept('http://localhost:3000/api/customers/1', (request) => {
  request.respond({
    body:
      '{"id":1,"firstName":"ted","lastName":"james",' +
      '"gender":"male","address":"888 Anywhere St.","city":" Phoenix ",' +
      '"state":{"abbreviation":"AZ","name":"Arizona"},' +
      '"orders":[{"productName":"Basketball","itemCost":7.99},' +
      '{"productName":"Shoes","itemCost":199.99}],' +
      '"latitude":33.299,"longitude":-111.963}',
  });
});
