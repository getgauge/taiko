const expect = require("chai").expect;
const {
  openBrowser,
  closeBrowser,
  switchTo,
  text,
  goto,
  openTab,
  closeTab,
  setConfig,
  evaluate,
  openIncognitoWindow,
  closeIncognitoWindow,
  currentURL,
} = require("../../lib/taiko");
const { openBrowserArgs, resetConfig } = require("./test-util");

const { createHtml, removeFile } = require("./test-util");

describe("Browser Context", () => {
  let url1, url2;
  before(async () => {
    await openBrowser(openBrowserArgs);
    setConfig({
      waitForNavigation: true,
      retryTimeout: 10,
      retryInterval: 10,
    });
    const innerHtml = `<section class="header">
                    <h1>Incognito tests</h1>
                      </section>
                        <section class='main-content'>
                          <div class='item'>
                            Item 1
                          </div>
                          <div class='item'>
                            Browser1
                      </div>
                    </section>`;

    const innerHtml1 = `<section class="header">
                      <h1>Incognitotests</h1>
                        </section>
                          <section class='main-content'>
                            <div class='item'>
                              Item 2
                            </div>
                            <div class='item'>
                            Browser2
                      </div>
                      </section>`;
    url1 = createHtml(innerHtml, "Incognito");
    url2 = createHtml(innerHtml1, "Incognito1");
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(url2);
    removeFile(url1);
  });

  describe("open browser and create browser context", () => {
    it("Should have incognito window", async () => {
      await openIncognitoWindow(url1, { name: "admin" });
      const actual = await text("Browser1").exists();
      expect(actual).to.be.true;

      await openIncognitoWindow(url2, { name: "user" });

      const actualBrowser2 = await text("Browser2").exists();
      expect(actualBrowser2).to.be.true;

      await switchTo({ name: "admin" });
      const backToUser1 = await text("Browser1").exists();
      expect(backToUser1).to.be.true;

      const browser1 = await evaluate(text("Item 1"), (element) => {
        return element.textContent.trim();
      });
      expect(browser1).to.be.equal("Item 1");

      const inactiveUser2 = await text("Browser2").exists();
      expect(inactiveUser2).to.be.false;
    });

    after(async () => {
      await closeIncognitoWindow("admin");
      await closeIncognitoWindow("user");
    });
  });

  describe("open incognito window without url", () => {
    it("should open a blank page when url not given", async () => {
      await openIncognitoWindow({ name: "admin" });
      expect(await currentURL()).to.equal("about:blank");
      await closeIncognitoWindow("admin");
    });
  });

  describe("Open window in Incognito Mode", () => {
    it("Open window in incognito", async () => {
      await openIncognitoWindow(url1, { name: "admin" });
    });
    after(async () => {
      await closeIncognitoWindow("admin");
    });
  });

  describe("Open window in Incognito Mode", () => {
    it("Open window in incognito and use the default window", async () => {
      await openIncognitoWindow(url1, { name: "admin" });
      await closeIncognitoWindow("admin");
      await goto(url1);
      const backToDefaultBrowser = await text("Browser1").exists();
      expect(backToDefaultBrowser).to.be.true;
    });
  });

  describe("Open window with same window name", () => {
    it("Should throw error if window name is not unique", async () => {
      await openIncognitoWindow(url1, { name: "admin" });
      try {
        await openIncognitoWindow(url1, { name: "admin" });
      } catch (err) {
        expect(err.message).to.be.equal(
          "There is a already a window/tab with name admin. Please use another name",
        );
      }
    });
    after(async () => {
      await closeIncognitoWindow("admin");
    });
  });

  describe("Isolation session storage test", () => {
    it("should isolate localStorage and cookies", async () => {
      await openIncognitoWindow(url1, { name: "admin" });
      await evaluate(() => {
        localStorage.setItem("name", "page1");
      });

      await openIncognitoWindow(url2, { name: "user" });

      await evaluate(() => {
        localStorage.setItem("name", "page2");
      });

      const adminSessionLocalStorage = await evaluate(() => {
        return localStorage.getItem("name");
      });

      expect(adminSessionLocalStorage).to.equal("page2");

      await switchTo({ name: "admin" });

      const userSessionLocalStorage = await evaluate(() => {
        return localStorage.getItem("name");
      });

      expect(userSessionLocalStorage).to.equal("page1");
    });
    after(async () => {
      await closeIncognitoWindow("admin");
      await closeIncognitoWindow("user");
    });
  });

  describe("open window throws an error", () => {
    it("openIncognitoWindow should throw an error when url parameter is missing", async () => {
      await openIncognitoWindow({ name: "window" }).catch((error) =>
        expect(error).to.be.an.instanceOf(TypeError),
      );
    });

    it("openIncognitoWindow should throw an error when window name parameter is missing", async () => {
      await openIncognitoWindow("localhost:8000").catch((error) =>
        expect(error).to.be.an.instanceOf(TypeError),
      );
    });
  });

  describe("close incognito window", () => {
    it("closeIncognitoWindow should not throw error when the target used to get context id is closed", async () => {
      let exceptionThrown = false;

      try {
        await openIncognitoWindow({ name: "admin" });
        await goto(url1);
        await openTab(url2);
        await closeTab(url1);
        await closeIncognitoWindow("admin");
      } catch {
        exceptionThrown = true;
      }

      expect(exceptionThrown).to.be.false;
    });
  });
});
