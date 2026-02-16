const expect = require("chai").expect;
const {
  openBrowser,
  goto,
  textBox,
  closeBrowser,
  clear,
  setConfig,
  write,
  into,
  $,
  click,
} = require("taiko");
const {
  createHtml,
  openBrowserArgs,
  removeFile,
  resetConfig,
} = require("./test-util");
const test_name = "Clear";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml =
      `<script>

    class ShadowButton extends HTMLElement {
      constructor() {
        super();
        var shadow = this.attachShadow({mode: 'open'});

        var button = document.createElement('input');
        button.setAttribute('type', 'text');
        button.setAttribute('id', 'Shadow text');
        button.setAttribute('value', 'Shadow text');
        shadow.appendChild(button);

      }
    }
    customElements.define('shadow-button', ShadowButton);
  </script>` +
      " <shadow-button></shadow-button>" +
      `
        <form>
            <p>
                <label for="name">
                    Name<input type="text" name="user[name]" id="name" value="Example" disabled/>
                </label>
                <label for="email">
                    Email<input type="text" name="user[email]" id="email" value="example@test.com"/>
                </label>
                <label for="address">
                    Address
                    <textarea name="user[address]" id="address">Address in
multiple lines.</textarea>
                </label>

                <label for="country">
                        Country<input type="text" name="user[country]" id="country" value="" onkeyup="displayInfo(this)"/>
                </label>
                <input type="reset" value="Reset" />
            </p>
        </form>
        <div id='info-borad' ></div>
        <script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(() => {
                    document.getElementById('name').disabled = false;
                }, 50);

                function displayInfo(element) {
                    console.log(element);
                    console.log(element.value);
                    document.getElementById('info-borad').innerText = element.value;
                }

                document.getElementById('country').addEventListener('keyup', function() {
                    displayInfo(this);
                });
            });
        </script>
        `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 100,
      retryInterval: 10,
    });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  describe("input field", () => {
    afterEach(async () => {
      await click("Reset");
    });

    it("should clear content", async () => {
      expect(await textBox("Email").value()).to.equal("example@test.com");
      await clear(textBox("Email"));
      expect(await textBox("Email").value()).to.equal("");
    });

    it("should wait for input to be clearable", async () => {
      expect(await textBox("Name").value()).to.equal("Example");
      await clear(textBox("Name"));
      expect(await textBox("Name").value()).to.equal("");
    });
  });

  describe("textarea", () => {
    afterEach(async () => {
      await click("Reset");
    });
    it("should clear whole content", async () => {
      expect(await textBox("Address").value()).to.equal(
        "Address in\nmultiple lines.",
      );
      await clear(textBox("Address"));
      expect(await textBox("Address").value()).to.equal("");
    });
  });

  describe("shadowDom", () => {
    it("should clear whole content", async () => {
      expect(await textBox({ id: "Shadow text" }).value()).to.equal(
        "Shadow text",
      );
      await clear(textBox({ id: "Shadow text" }));
      expect(await textBox({ id: "Shadow text" }).value()).to.equal("");
    });
  });

  describe("events", () => {
    afterEach(async () => {
      await click("Reset");
    });
    it("should be trigged after clearing textbox", async () => {
      await write("No man land", into(textBox("Country")));
      expect(await $("#info-borad").text()).to.equal("No man land");
      await clear(textBox("Country"));
      expect(await $("#info-borad").text()).to.equal("");
    });
  });
});
