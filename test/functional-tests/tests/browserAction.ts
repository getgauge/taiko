import { Step } from "gauge-ts";
import {
  closeTab,
  currentURL,
  emulateDevice,
  emulateTimezone,
  evaluate,
  getCookies,
  goBack,
  goForward,
  goto,
  openTab,
  overridePermissions,
  reload,
  setLocation,
  switchTo,
} from "taiko";
const assert = require("node:assert");
const cwd = process.cwd();

export default class Assert {
  @Step("Switch to tab with url <title>")
  public async switchTabWithURL(title: RegExp) {
    await switchTo(title);
  }

  @Step("Open Tab <url>")
  public async openTab(url: string) {
    await openTab(url);
  }

  @Step("Open Tab with name <tabName>")
  public async openTabWithName(tabName: string) {
    await openTab({ name: tabName });
  }

  @Step("Switch to tab with name <tabName>")
  public async switchToWithName(tabName: string) {
    await switchTo({ name: tabName });
  }

  @Step("Assert url to be <url>")
  public async assertUrl(url: string) {
    const currentUrl = await currentURL();
    assert.equal(currentUrl, url);
  }

  @Step("Close Tab <url>")
  public async closeTabWithURL(url: string | RegExp) {
    await closeTab(url);
  }

  @Step("Close Tab")
  public async closeTab() {
    await closeTab();
  }

  @Step("Reload the page")
  public async reloadPage() {
    await reload();
  }

  @Step("Assert cookies to be present")
  public async assertCookies() {
    const cookies = await getCookies();
    assert.ok(cookies.length > 0);
  }

  @Step("Assert cookie with valid options url <arg>")
  public async assertCookiesWithOptions(arg: string) {
    const cookies = await getCookies({ urls: [arg] });
    assert.ok(cookies.length > 0);
  }

  @Step("Assert cookie with invalid options url <arg>")
  public async assertCookieWithInvalidOption(arg: string) {
    const cookies = await getCookies({ urls: [arg] });
    assert.ok(cookies.length === 0);
  }

  @Step("Navigate to file with relative Path <filePath>")
  public async navigateToFileWithRelativePath(filePath: string) {
    await goto(`file:///${cwd}${filePath}`);
  }

  @Step("Override browser permission with <geolocation> for site <url>")
  public async overrideBrowserPermission(geolocation: string, url: string) {
    await overridePermissions(url, [geolocation]);
  }

  @Step("Setlocation with longitude as <longitude> and latitude as <latitude>")
  public async setLocationWithLatAndLong(longitude: string, latitude: string) {
    await setLocation({
      longitude: Number.parseFloat(longitude),
      latitude: Number.parseFloat(latitude),
    });
  }

  @Step("Assert location longitude as <longitude> and latitude as <latitude>")
  public async function(longitude: string, latitude: string) {
    const geolocation: any = await evaluate(
      () =>
        new Promise((resolve) =>
          navigator.geolocation.getCurrentPosition((position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }),
        ),
    );
    assert.equal(geolocation.longitude, Number.parseFloat(longitude));
    assert.equal(geolocation.latitude, Number.parseFloat(latitude));
  }

  @Step("Emulate device <deviceModel>")
  public async emulateDevice(deviceModel: string) {
    await emulateDevice(deviceModel);
  }

  @Step("Assert width is <width> and height is <height>")
  public async assertWidthAndHeight(width: any, height: any) {
    const innerWidth = await evaluate(() => window.innerWidth);
    const innerHeight = await evaluate(() => window.innerHeight);
    assert.equal(innerWidth, width);
    assert.equal(innerHeight, height);
  }

  @Step("Navigate back")
  public async navigateBack() {
    await goBack();
  }

  @Step("Navigate forward")
  public async navigateForward() {
    await goForward();
  }

  @Step("Set timezone <arg0>")
  public async setTimeZone(arg0: string) {
    await emulateTimezone(arg0);
  }
}
