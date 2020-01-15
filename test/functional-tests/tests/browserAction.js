/* global globalThis */

const {
  switchTo,
  openTab,
  closeTab,
  reload,
  goto,
  overridePermissions,
  setLocation,
  evaluate,
  emulateDevice,
  goBack,
  goForward,
  getCookies,
  emulateTimezone,
} = require('taiko');
const assert = require('assert');
const cwd = process.cwd();

step('Switch to tab with url <title>', async function(title) {
  await switchTo(title);
});

step('Open Tab <url>', async function(url) {
  await openTab(url);
});

step('Close Tab <url>', async function(url) {
  await closeTab(url);
});

step('Close Tab', async function() {
  await closeTab();
});

step('Reload the page', async function() {
  await reload();
});

step('Assert cookies to be present', async function() {
  const cookies = await getCookies();
  assert.ok(cookies.length > 0);
});

step('Assert cookie with valid options url <arg>', async function(arg) {
  const cookies = await getCookies({ urls: [arg] });
  assert.ok(cookies.length > 0);
});

step('Assert cookie with invalid options url <arg>', async function(arg) {
  const cookies = await getCookies({ urls: [arg] });
  assert.ok(cookies.length === 0);
});

step('Navigate to file with relative Path <filePath>', async function(filePath) {
  await goto('file:///' + cwd + filePath);
});

step('Override browser permission with <geolocation> for site <url>', async function(
  geolocation,
  url,
) {
  await overridePermissions(url, [geolocation]);
});

step('Setlocation with longitude as <longitude> and latitude as <latitude>', async function(
  longitude,
  latitude,
) {
  await setLocation({
    longitude: parseFloat(longitude),
    latitude: parseFloat(latitude),
  });
});

step('Assert location longitude as <longitude> and latitude as <latitude>', async function(
  longitude,
  latitude,
) {
  const geolocation = await evaluate(
    () =>
      new Promise(resolve =>
        navigator.geolocation.getCurrentPosition(position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }),
      ),
  );
  assert.equal(geolocation.longitude, parseFloat(longitude));
  assert.equal(geolocation.latitude, parseFloat(latitude));
});

step('Emulate device <deviceModel>', async function(deviceModel) {
  await emulateDevice(deviceModel);
});

step('Assert width is <width> and height is <height>', async function(width, height) {
  const innerWidth = await evaluate(() => window.innerWidth);
  const innerHeight = await evaluate(() => window.innerHeight);
  assert.equal(innerWidth, width);
  assert.equal(innerHeight, height);
});

step('Navigate back', async function() {
  await goBack();
});

step('Navigate forward', async function() {
  await goForward();
});

step('Set timezone <arg0>', async function(arg0) {
  await evaluate(() => {
    return (globalThis.date = new Date(1479579154987));
  });
  await emulateTimezone(arg0);
});
