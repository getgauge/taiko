const {
  switchTo,
  openTab,
  closeTab,
  reload,
  goto,
  overridePermissions,
  setLocation,
  evaluate,
  emulateDevice
} = require('../../../lib/taiko');
const assert = require('assert');
const cwd = process.cwd();

step('Switch to tab with title <title>', async function(title) {
  await switchTo(title);
});

step('Open Tab <url>', async function(url) {
  await openTab(url);
});

step('Close Tab <url>', async function(url) {
  await closeTab(url);
});

step('Open Tab <arg0> with timeout <time>', async function(url, time) {
  await openTab(url, { timeout: time });
});

step('Close Tab', async function() {
  await closeTab();
});

step('Reload the page', async function() {
  await reload();
});

step('Navigate to file with relative Path <filePath>', async function(
  filePath
) {
  await goto('file:///' + cwd + filePath);
});

step(
  'Override browser permission with <geolocation> for site <url>',
  async function(geolocation, url) {
    await overridePermissions(url, [geolocation]);
  }
);

step(
  'Setlocation with longitude as <longitude> and latitude as <latitude>',
  async function(longitude, latitude) {
    await setLocation({
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    });
  }
);

step(
  'Assert location longitude as <longitude> and latitude as <latitude>',
  async function(longitude, latitude) {
    const geolocation = await evaluate(
      () =>
        new Promise(resolve =>
          navigator.geolocation.getCurrentPosition(position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          })
        )
    );
    assert.equal(geolocation.result.longitude, parseFloat(longitude));
    assert.equal(geolocation.result.latitude, parseFloat(latitude));
  }
);

step('Emulate device <deviceModel>', async function(deviceModel) {
  await emulateDevice(deviceModel);
});

step('Assert width is <width> and height is <height>', async function(
  width,
  height
) {
  const innerWidth = (await evaluate(() => window.innerWidth)).result;
  const innerHeight = (await evaluate(() => window.innerHeight)).result;
  assert.equal(innerWidth, width);
  assert.equal(innerHeight, height);
});
