import {
  clearIntercept,
  clearPermissionOverrides,
  closeBrowser,
  closeIncognitoWindow,
  closeTab,
  deleteCookies,
  emulateDevice,
  emulateNetwork,
  getCookies,
  intercept,
  openBrowser,
  openIncognitoWindow,
  openTab,
  overridePermissions,
  setCookie,
  setLocation,
  setViewPort,
  switchTo,
} from "../../taiko";

// ------------------------------------------
// openBrowser
// https://docs.taiko.dev/api/openbrowser
// ------------------------------------------

openBrowser(); // $ExpectType Promise<void>
openBrowser({ headless: false }); // $ExpectType Promise<void>
openBrowser({ args: ["--window-size=1440,900"] }); // $ExpectType Promise<void>

// $ExpectType Promise<void>
openBrowser({
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-first-run",
    "--no-sandbox",
    "--no-zygote",
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
// https://docs.taiko.dev/api/switchto
// ------------------------------------------

switchTo(/taiko.dev/); // $ExpectType Promise<void>
switchTo(/Taiko/); // $ExpectType Promise<void>
switchTo(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/); // $ExpectType Promise<void>
switchTo(/Go*gle/); // $ExpectType Promise<void>
switchTo(/google.com/); // $ExpectType Promise<void>
switchTo({ name: "newyorktimes" }); // $ExpectType Promise<void>

// ------------------------------------------
// intercept
// https://docs.taiko.dev/api/intercept
// ------------------------------------------

// Case 1: Block URL (Blocks all request for people.png)
// $ExpectType Promise<void>
intercept("http://localhost:3000/assets/images/people.png");

// Case 2: Mock response (Mocks response to modify address from "888 Central St." to "12345 Central St." )
// $ExpectType Promise<void>
intercept("http://localhost:3000/api/customers/11", {
  body:
    '{"id":11,"firstName":"ward","lastName":"bell","gender":"male",' +
    '"address":"12345 Central St.","city":"Los Angeles",' +
    '"state":{"abbreviation":"CA","name":"California"},' +
    '"latitude":34.042552,"longitude":-118.266429}',
});

// Case 3: Override request (Overrides google4_hdpi.png url to return female.png can be seen in map)
// $ExpectType Promise<void>
intercept(
  "https://maps.gstatic.com/mapfiles/api-3/images/google4_hdpi.png",
  (request) => {
    request.continue({ url: "http://localhost:3000/assets/images/female.png" });
  },
);
// $ExpectType Promise<void>
intercept(
  "https://maps.gstatic.com/mapfiles/api-3/images/google4_hdpi.png",
  (request) => {
    request.continue({
      url: "http://localhost:3000/assets/images/female.png",
      headers: {
        foo: "bar", // set "foo" header
        origin: undefined, // remove "origin" header
      },
    });
  },
);

// Case 4: Redirect URL (Overrides male.png to female.png)
// $ExpectType Promise<void>
intercept(
  "http://localhost:3000/assets/images/male.png",
  "http://localhost:3000/assets/images/female.png",
);

// Case 5: Mock response based on request (Mocks response to modify address from "1234 Anywhere St." to "888 Anywhere St.")
// $ExpectType Promise<void>
intercept("http://localhost:3000/api/customers/1", (request) => {
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

// ------------------------------------------
// emulateNetwork
// https://docs.taiko.dev/api/emulatenetwork
// ------------------------------------------

emulateNetwork("Offline"); // $ExpectType Promise<void>
emulateNetwork("Good2G"); // $ExpectType Promise<void>
emulateNetwork({
  offline: false,
  downloadThroughput: 6400,
  uploadThroughput: 2560,
  latency: 500,
}); // $ExpectType Promise<void>
emulateNetwork({
  downloadThroughput: 6400,
  uploadThroughput: 2560,
  latency: 500,
}); // $ExpectType Promise<void>

// ------------------------------------------
// emulateDevice
// https://docs.taiko.dev/api/emulatedevice
// ------------------------------------------

emulateDevice("iPhone 6"); // $ExpectType Promise<void>

// ------------------------------------------
// setViewPort
// https://docs.taiko.dev/api/setviewport
// ------------------------------------------

setViewPort({ width: 600, height: 800 }); // $ExpectType Promise<void>

// $ExpectType Promise<void>
setViewPort({
  width: 600,
  height: 800,
  deviceScaleFactor: 1,
  mobile: true,
  scale: 1,
  screenWidth: 1,
  screenHeight: 1,
  positionX: 1,
  positionY: 1,
  dontSetVisibleSize: true,
  screenOrientation: { type: "landscapePrimary", angle: 0 },
  viewport: { x: 1, y: 1, width: 1, height: 1, scale: 1 },
});

// ------------------------------------------
// openTab
// https://docs.taiko.dev/api/opentab
// ------------------------------------------

openTab("https://taiko.dev"); // $ExpectType Promise<void>
openTab(); // $ExpectType Promise<void>
openTab("https://taiko.dev", { name: "taiko" }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
openTab("https://taiko.dev", {
  waitForNavigation: true,
  name: "aaa",
  navigationTimeout: 10000,
  waitForStart: 200,
  waitForEvents: [
    "DOMContentLoaded",
    "loadEventFired",
    "networkAlmostIdle",
    "networkIdle",
    "firstPaint",
    "firstContentfulPaint",
    "firstMeaningfulPaint",
  ],
});

// ------------------------------------------
// closeTab
// https://docs.taiko.dev/api/closetab
// ------------------------------------------

closeTab(); // $ExpectType Promise<void>
closeTab("Open Source Test Automation Framework | Gauge"); // $ExpectType Promise<void>
closeTab("https://gauge.org"); // $ExpectType Promise<void>
closeTab(/Go*gle/); // $ExpectType Promise<void>
closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/); // $ExpectType Promise<void>

// ------------------------------------------
// openIncognitoWindow
// https://docs.taiko.dev/api/openIncognitoWindow
// ------------------------------------------

openIncognitoWindow(); // $ExpectType Promise<void>
openIncognitoWindow("https://google.com"); // $ExpectType Promise<void>
openIncognitoWindow("https://google.com", { name: "windowName" }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
openIncognitoWindow("https://google.com", {
  waitForNavigation: true,
  name: "aaa",
  navigationTimeout: 10000,
  waitForStart: 200,
  waitForEvents: [
    "DOMContentLoaded",
    "loadEventFired",
    "networkAlmostIdle",
    "networkIdle",
    "firstPaint",
    "firstContentfulPaint",
    "firstMeaningfulPaint",
  ],
});

// ------------------------------------------
// closeIncognitoWindow
// https://docs.taiko.dev/api/closeIncognitoWindow
// ------------------------------------------

closeIncognitoWindow("windowName"); // $ExpectType Promise<void>
closeIncognitoWindow(); // $ExpectError

// ------------------------------------------
// overridePermissions
// https://docs.taiko.dev/api/overridePermissions
// ------------------------------------------

overridePermissions("http://maps.google.com", ["geolocation"]); // $ExpectType Promise<void>

// ------------------------------------------
// clearPermissionOverrides
// https://docs.taiko.dev/api/clearPermissionOverrides
// ------------------------------------------

clearPermissionOverrides(); // $ExpectType Promise<void>

// ------------------------------------------
// setCookie
// https://docs.taiko.dev/api/setCookie
// ------------------------------------------

setCookie("CSRFToken", "csrfToken", {
  url: "http://the-internet.herokuapp.com",
}); // $ExpectType Promise<void>
setCookie("CSRFToken", "csrfToken", { domain: "herokuapp.com" }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
setCookie("CSRFToken", "csrfToken", {
  url: "an url",
  domain: "a domain",
  path: "a path",
  secure: true,
  httpOnly: true,
  sameSite: "a string",
  expires: 1000000,
});
setCookie("CSRFToken", "csrfToken", {}); // $ExpectType Promise<void>
setCookie("CSRFToken", "csrfToken"); // $ExpectType Promise<void>

// ------------------------------------------
// deleteCookies
// https://docs.taiko.dev/api/deleteCookies
// ------------------------------------------

deleteCookies(); // $ExpectType Promise<void>
deleteCookies("CSRFToken", { url: "http://the-internet.herokuapp.com" }); // $ExpectType Promise<void>
deleteCookies("CSRFToken", { domain: "herokuapp.com" }); // $ExpectType Promise<void>
// $ExpectType Promise<void>
deleteCookies("CSRFToken", {
  url: "an url",
  domain: "a domain",
  path: "a path",
});

// ------------------------------------------
// getCookies
// https://docs.taiko.dev/api/getCookies
// ------------------------------------------

getCookies(); // $ExpectType Promise<Cookie[]>
getCookies({ urls: ["https://the-internet.herokuapp.com"] }); // $ExpectType Promise<Cookie[]>

// ------------------------------------------
// setLocation
// https://docs.taiko.dev/api/setLocation
// ------------------------------------------

// $ExpectType Promise<void>
setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy: 20 });
// $ExpectType Promise<void>
setLocation({ latitude: 27.1752868, longitude: 78.040009 });
// $ExpectError
setLocation({ latitude: 27.1752868 });
// $ExpectError
setLocation({ longitude: 78.040009 });

// ------------------------------------------
// clearIntercept
// https://docs.taiko.dev/api/clearIntercept
// ------------------------------------------

clearIntercept("https://google.com"); // $ExpectType void
clearIntercept(); // $ExpectType void
