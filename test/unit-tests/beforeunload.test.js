const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  goto,
  closeBrowser,
  write,
  beforeunload,
  accept,
  reload,
  openTab,
  setConfig,
} = require("../../lib/taiko");
const { createHtml, removeFile, openBrowserArgs } = require("./test-util");
const test_name = "beforeunload";

describe(test_name, () => {
  let filePath;
  let filePath1;
  let called = false;
  before(async () => {
    const innerHtml = `
    <div class="main">
        <label>Write your name : <input id='name' type="text" autofocus /> </label>
    </div>
    <script>
        let oldValue = document.getElementById('name').value;
        window.addEventListener('beforeunload', function (e) {
          let newValue = document.getElementById('name').value;
          if( oldValue != newValue) {
            event.preventDefault();
            // Legacy support for older browsers.
            return (event.returnValue = true);
          }
        });
    </script>
    `;
    filePath = createHtml(innerHtml, test_name);
    filePath1 = createHtml("<div>empty</div>", "Page without beforeunload");
    setConfig({
      waitForNavigation: true,
      retryTimeout: 1000,
      retryInterval: 10,
    });
  });

  afterEach(() => {
    called = false;
  });

  after(async () => {
    removeFile(filePath);
    removeFile(filePath1);
  });

  describe("on browser close", () => {
    it("should invoke callback when beforeunload popup shows up on close browser ", async () => {
      await openBrowser(openBrowserArgs);
      await goto(filePath);
      beforeunload(async () => {
        called = true;
        await accept();
      });
      await write("some thing", "Write your name :");
      await closeBrowser();
      expect(called).to.be.true;
    });

    it("should close browser properly", async () => {
      await openBrowser(openBrowserArgs);
      beforeunload(() => {
        called = true;
      });
      await goto(filePath);
      await write("some thing", "Write your name :");
      await openTab(filePath1);
      await closeBrowser();
      expect(called).to.be.false;
    }).timeout(10000);
  });

  describe("on navigation out of the page", () => {
    before(async () => {
      await openBrowser(openBrowserArgs);
    });

    beforeEach(async () => {
      await goto(filePath);
    });

    after(async () => {
      await closeBrowser();
    });

    it("should invoke callback when beforeunload popup shows up on page navigation", async () => {
      beforeunload(async () => {
        called = true;
        await accept();
      });
      await write("some thing", "Write your name :");
      await goto(filePath1);
      expect(called).to.be.true;
    });

    it("should invoke callback when beforeunload popup shows up on reload", async () => {
      beforeunload(async () => {
        called = true;
        await accept();
      });
      await write("some thing", "Write your name :");
      await reload();
      expect(called).to.be.true;
    });
  });
});
