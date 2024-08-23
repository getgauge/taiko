const expect = require("chai").expect;
const {
  openBrowser,
  goto,
  closeBrowser,
  text,
  textBox,
  toRightOf,
  evaluate,
  setConfig,
  below,
  near,
  $,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "textMatch";

describe("match", () => {
  let filePath;

  describe("text match", () => {
    before(async () => {
      const innerHtml = `
    <div>
        <!-- //text node exists -->
        <div>
            <div name="text_node">
                User name: <input type="text" name="uname">
            </div>
            <p style="display:none"> Hidden text </p>
            <div name="value_or_type_of_field_as_text">
                <input type="button" value="click me">
                <input type="submit">
            </div>
            <div name="text_across_element">
                <div>Text <span>Across</span> Element</div>
            </div>
            <div id="inTop" name="text_same_as_iframe" style="display: none">
                Text in iframe
            </div>
            <iframe></iframe>
            <script>
                document.querySelector("iframe").contentDocument.write('<div id="inIframe">Text in iframe</div>');
                document.querySelector("iframe").contentDocument.close();
                class ShadowButton extends HTMLElement {
                       constructor() {
                         super();
                         var shadow = this.attachShadow({mode: 'open'});
                         var para = document.createElement('p');
                         para.textContent = "Text in shadow dom"
                         shadow.appendChild(para);
                         var link = document.createElement('a');
                         link.textContent = "testLinkInShadowDom";
                         shadow.appendChild(link);
                       }
                     }
                     customElements.define('shadow-button', ShadowButton);
            </script>
            <shadow-button></shadow-button>
            <!-- // same text node in page -->
            <div>
                <p>Sign up</p>
            </div>
            <div>
                <p>By clicking “Sign up for GitHub”</p>
            </div>
            <span>Sign up for GitHub<span>
            <!-- //text node in different tags -->
            <div>create account</div>
            <div>By clicking “create account in GitHub”</div>
            <a href="github.com">create account</a>
            <a href="github.com">create account now</a>
            <button class="button" type="submit">create account</button>
            <button class="button" type="submit">create account in GitHub</button>
            <button class="button" type="submit">
            <span> spanButton for login</span>
            </button>
            <!-- //text node with input tag -->
            <input type="text" value="password" />
            <input type="text" value="Enter password" />
            <!-- //text node with value -->
            <p>taiko demo</p>
            <input type="text" value="taiko demo" />
            <p>Enter name for taiko demo</p>
            <input type="text" value="Enter name for taiko demo" />
            <!-- //text node with type -->
            <p>this is text</p>
            <input type="text" value="user name" />
            <p>Enter user name in textbox</p>
            <input type="text" value="Enter user name" />
        </div>
        <div>+1 234 567</div>
        <div >
            <p>Test&nbsp;text&nbsp;<span>with&nbsp;nbsp space</span></p>       
            <h1>Elements visibility</h1>
            <div>
                <p>Visible content</p>
            </div>
            <div style="display:none">
                <p>Parent element has display none</p>
            </div>
            <div>
                <p style="display:none">Element it self has display none</p>
            </div>
            <div style="display:inline">
                <p>
                    With 'display: inline', the width, height,
                    margin-top, margin-bottom, and float properties have no effect.
                    Hence, element.offsetHeight and element.offsetWidt are zero(0).
                </p>
                Element with display inline should be invisible
            </div>
            <div>
            </div>
        </div>
        <div>someNode</div>
    </div>
            `;
      filePath = createHtml(innerHtml, test_name);
      await openBrowser(openBrowserArgs);
      await goto(filePath);
      setConfig({
        waitForNavigation: false,
        retryTimeout: 10,
        retryInterval: 10,
      });
    });
    after(async () => {
      resetConfig();
      await closeBrowser();
      removeFile(filePath);
    });

    describe("shadow dom", () => {
      it("test exact match exists", async () => {
        expect(await text("Text in shadow dom").exists()).to.be.true;
      });
      it("test contains match exists", async () => {
        expect(await text("shadow dom").exists()).to.be.true;
      });
      it("test match with tagname", async () => {
        expect(await text("testLinkInShadowDom").exists()).to.be.true;
      });
    });

    describe("regex", () => {
      it("test exact match exists", async () => {
        expect(await text(/User/).exists()).to.be.true;
      });
      it("test contains match exists", async () => {
        expect(await text(/account/).exists()).to.be.true;
      });
      it("test value match", async () => {
        expect(await text(/Enter password/).exists()).to.be.true;
      });
      it("test regex as string", async () => {
        expect(await text("/Enter password/").exists()).to.be.true;
      });
      it("test with regex object", async () => {
        expect(await text(/Enter password/).exists()).to.be.true;
      });
      it("test regex with flag", async () => {
        expect(await text(/Enter password/g).exists()).to.be.true;
      });
      it("test exact match for text", async () => {
        expect(await text(/value/, { exactMatch: true }).exists()).to.be.false;
      });
      it("test partial match get()", async () => {
        expect(await text(/User/i).elements()).to.have.lengthOf(4);
      });
      it("test partial match get()", async () => {
        expect(await text(/Text/).elements()).to.have.lengthOf(5);
      });
    });

    describe("text node", () => {
      it("test exact match exists()", async () => {
        expect(await text("User name:").exists()).to.be.true;
        expect(await text("user name:").exists()).to.be.true;
      });

      it("test exact match get()", async () => {
        expect(await text("User name:").elements()).to.have.lengthOf(1);
      });

      it("test exact match description", async () => {
        expect(text("User name:").description).to.be.eql(
          "Element with text User name: ",
        );
      });

      it("test partial match exists()", async () => {
        expect(await text("User").exists()).to.be.true;
      });

      it("test partial match get()", async () => {
        expect(await text("User").elements()).to.have.lengthOf(4);
      });

      it("test partial match description", async () => {
        expect(text("User").description).to.be.eql("Element with text User ");
      });

      it("test proximity selector", async () => {
        expect(await textBox(toRightOf("User name:")).exists()).to.be.true;
      });

      it("test text with special character", async () => {
        expect(await text("+1 234 567").exists()).to.be.true;
      });
    });

    describe("value or type of field as text", () => {
      it("test value as text exists()", async () => {
        expect(await text("click me").exists()).to.be.true;
      });

      it("test value as text get()", async () => {
        expect(await text("click me").elements()).to.have.lengthOf(1);
      });

      it("test value as text description", async () => {
        expect(text("click me").description).to.be.eql(
          "Element with text click me ",
        );
      });

      it("test type as text exists()", async () => {
        expect(await text("submit").exists()).to.be.true;
      });

      it("test type as text get()", async () => {
        expect(await text("submit").elements()).to.have.lengthOf(1);
      });

      it("test type as text description", async () => {
        expect(text("submit").description).to.be.eql(
          "Element with text submit ",
        );
      });

      it("test type as text", async () => {
        expect(await text("Elements visibility").text()).to.be.eql(
          "Elements visibility",
        );
      });
    });

    describe("text across element", () => {
      it("test exact match exists()", async () => {
        expect(await text("Text Across Element").exists()).to.be.true;
      });

      it("test exact match get()", async () => {
        expect(await text("Text Across Element").elements()).to.have.lengthOf(
          1,
        );
      });

      it("test exact match description", async () => {
        expect(text("Text Across Element").description).to.be.eql(
          "Element with text Text Across Element ",
        );
      });

      it("test partial match exists()", async () => {
        expect(await text("Text").exists()).to.be.true;
      });

      //should be 1 since an exact match is found
      it.skip("test partial match get()", async () => {
        expect(await text("Text").elements()).to.have.lengthOf(3);
      });

      it("test partial match description", async () => {
        expect(text("Text").description).to.be.eql("Element with text Text ");
      });
    });
    describe("match text in different tags", () => {
      it("test exact match for text in multiple elements", async () => {
        expect(await text("create account").exists()).to.be.true;
        expect(await text("create account").elements()).to.have.lengthOf(3);
        expect(text("create account").description).to.be.eql(
          "Element with text create account ",
        );
      });
      it("test contains match for text in multiple elements", async () => {
        expect(await text("account").exists()).to.be.true;
        expect(await text("account").elements()).to.have.lengthOf(6);
        expect(text("account").description).to.be.eql(
          "Element with text account ",
        );
      });
    });
    describe("match text as value in input field", () => {
      it("test exact match for value in input", async () => {
        expect(await text("password").exists()).to.be.true;
        expect(await text("password").elements()).to.have.lengthOf(1);
        expect(text("password").description).to.be.eql(
          "Element with text password ",
        );
      });
      it("test contains match for value in input", async () => {
        expect(await text("pass").exists()).to.be.true;
        expect(await text("pass").elements()).to.have.lengthOf(2);
        expect(text("pass").description).to.be.eql("Element with text pass ");
      });
    });
    describe("match text for value and paragraph", () => {
      it("test exact match for value and text", async () => {
        expect(await text("taiko demo").exists()).to.be.true;
        expect(await text("taiko demo").elements()).to.have.lengthOf(2);
        expect(text("taiko demo").description).to.be.eql(
          "Element with text taiko demo ",
        );
      });
      it("test contains match for value and text", async () => {
        expect(await text("demo").exists()).to.be.true;
        expect(await text("demo").elements()).to.have.lengthOf(4);
        expect(text("demo").description).to.be.eql("Element with text demo ");
      });
    });
    describe("match text for paragraph", () => {
      //should be 1 since an exact match is found
      it.skip("test exact match for type", async () => {
        expect(await text("text").exists()).to.be.true;
        expect(await text("text").elements()).to.have.lengthOf(3);
        expect(text("text").description).to.be.eql("Element with text text ");
      });

      it("test contains match for text", async () => {
        expect(await text("tex").exists()).to.be.true;
        expect(await text("tex").elements()).to.have.lengthOf(10);
        expect(text("tex").description).to.be.eql("Element with text tex ");
      });
    });

    describe("text with &nbsp should be considers as with normal space", () => {
      it("test contains exists()", async () => {
        expect(await text("Test text").exists()).to.be.true;
      });
      it("test exists", async () => {
        expect(await text("Test text with nbsp space").exists()).to.be.true;
      });
    });

    describe("text in iframe should be matched if match in top too", () => {
      it("test text exists()", async () => {
        expect(await text("Text in iframe").exists()).to.be.true;
      });

      it("test text get()", async () => {
        expect(await text("Text in iframe").elements()).to.have.lengthOf(2);
      });

      it("test text description", async () => {
        expect(text("Text in iframe").description).to.be.eql(
          "Element with text Text in iframe ",
        );
      });

      it("test text is from iframe", async () => {
        const id = await evaluate(
          text("Text in iframe", near("Text in iframe")),
          (elem) => {
            return elem.parentElement.id;
          },
        );
        expect(id).to.equal("inIframe");
      });
    });
    describe("match text in multiple paragraph", () => {
      it("test exact match for text", async () => {
        expect(await text("Sign up").exists()).to.be.true;
        expect(await text("Sign up").elements()).to.have.lengthOf(1);
        expect(text("Sign up").description).to.be.eql(
          "Element with text Sign up ",
        );
      });
      it("test contains match for text", async () => {
        expect(await text("Sign").exists()).to.be.true;
        expect(await text("Sign").elements()).to.have.lengthOf(3);
        expect(text("Sign").description).to.be.eql("Element with text Sign ");
      });
    });
    describe("match text in different tags", () => {
      it("test exact match for text in multiple elememts", async () => {
        expect(await text("create account").exists()).to.be.true;
        expect(await text("create account").elements()).to.have.lengthOf(3);
        expect(text("create account").description).to.be.eql(
          "Element with text create account ",
        );
      });
      it("test contains match for text in multiple elements", async () => {
        expect(await text("account").exists()).to.be.true;
        expect(await text("account").elements()).to.have.lengthOf(6);
        expect(text("account").description).to.be.eql(
          "Element with text account ",
        );
      });
    });
    describe("match text as value in input field", () => {
      it("test exact match for value in input", async () => {
        expect(await text("password").exists()).to.be.true;
        expect(await text("password").elements()).to.have.lengthOf(1);
        expect(text("password").description).to.be.eql(
          "Element with text password ",
        );
      });
      it("test contains match for value in input", async () => {
        expect(await text("pass").exists()).to.be.true;
        expect(await text("pass").elements()).to.have.lengthOf(2);
        expect(text("pass").description).to.be.eql("Element with text pass ");
      });
    });
    describe("match text for value and paragraph", () => {
      it("test exact match for value and text", async () => {
        expect(await text("taiko demo").exists()).to.be.true;
        expect(await text("taiko demo").elements()).to.have.lengthOf(2);
        expect(text("taiko demo").description).to.be.eql(
          "Element with text taiko demo ",
        );
      });
      it("test contains match for value and text", async () => {
        expect(await text("demo").exists()).to.be.true;
        expect(await text("demo").elements()).to.have.lengthOf(4);
        expect(text("demo").description).to.be.eql("Element with text demo ");
      });
    });
    describe("match text for type and paragraph", () => {
      //should be 1 since an exact match is found
      it.skip("test exact match for type", async () => {
        expect(await text("text").exists()).to.be.true;
        expect(await text("text").elements()).to.have.lengthOf(3);
        expect(text("text").description).to.be.eql("Element with text text ");
      });
      it("test contains match for type and text", async () => {
        expect(await text("tex").exists()).to.be.true;
        expect(await text("tex").elements()).to.have.lengthOf(10);
        expect(text("tex").description).to.be.eql("Element with text tex ");
      });
    });

    describe("Text visibility", () => {
      it("text should be visible", async () => {
        expect(await text("Visible content").exists()).to.be.true;
      });

      it("text should exists when parent element display is set to none", async () => {
        const exists = await text("Parent element has display none").exists();
        expect(exists).to.be.true;
      });
    });

    describe("fetch hidden text", () => {
      it("should return false for hidden element when isVisible fn is called on text", async () => {
        expect(await text("Hidden text").isVisible()).to.be.false;
      });
    });

    describe("test elementsList properties", () => {
      it("test get of elements", async () => {
        const elements = await text("someNode").elements();
        expect(elements[0].get()).to.be.a("string");
      });

      it("test description of elements", async () => {
        const elements = await text("someNode").elements();
        expect(elements[0].description).to.be.eql(
          "Element with text someNode ",
        );
      });
    });

    describe("text match in child element", () => {
      it("should match the text in child element", async () => {
        expect(await text("spanButton for login").exists()).to.be.true;
      });
    });
  });

  describe("text exists", () => {
    before(async () => {
      const innerHtml = `
      <!DOCTYPE html>
      <html>
      <body>
          <div id='prova' style='display:none'>Element Present</div>
      
          <script>
              window.onload = function () {
                  setTimeout(appeardiv,1000);
              }
              function appeardiv() {
                  document.getElementById('prova').style.display= "block";
              }
          </script>
      
      </body>
      </html>`;
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

    it("exists fn should wait for element to present with given time interval", async () => {
      expect(await text("Element Present").exists(100, 5000)).to.be.true;
    });
  });

  describe("match text with extact option", () => {
    before(async () => {
      const innerHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <p>New value</p>
        <p>Old value</p>
      </body>
      </html>`;
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
    it("test exact match for text", async () => {
      expect(await text("value", { exactMatch: true }).exists()).to.be.false;
    });

    it("test exact match for text with multiple elements", async () => {
      expect(
        await text("value", { exactMatch: true }).elements(),
      ).to.have.lengthOf(0);
    });

    it("test exact match for text with proximity selectors", async () => {
      expect(
        await text(
          "Old value",
          { exactMatch: true },
          below("New value"),
        ).exists(),
      ).to.be.true;
    });

    it("test exactMatch option set to false with proximity selectors", async () => {
      expect(
        await text("value", { exactMatch: false }, below("New value")).exists(),
      ).to.be.true;
    });

    it("test exactMatch option set to true with proximity selectors", async () => {
      expect(
        await text("value", { exactMatch: true }, below("New value")).exists(),
      ).to.be.false;
    });
  });

  describe("Parameters validation", () => {
    before(async () => {
      const innerHtml = `
        <div id='prova' style='display:none'>Element Present</div>
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

    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => text($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `text` selector. Refer https://docs.taiko.dev/api/text/ for the correct parameters",
      );
    });
  });

  describe("Text match with whitespaces", () => {
    before(async () => {
      const innerHtml = `
        <div>
          <p>    Leading whitespaces text</p>
          <p>Trailing whitespaces text    </p>
          <p>text      with      whitespaces</p>
        </div>
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
    it("test with leading whitespaces", async () => {
      expect(await text("Leading whitespaces text").exists()).to.be.true;
    });
    it("test with trailing whitespaces", async () => {
      expect(await text("Trailing whitespaces text").exists()).to.be.true;
    });
    it("test with other whitespaces", async () => {
      expect(await text("text with whitespaces").exists()).to.be.true;
      expect(await text("text with whitespaces    ").exists()).to.be.true;
      expect(await text("     text with whitespaces").exists()).to.be.true;
      expect(await text("text     with     whitespaces").exists()).to.be.true;
    });
  });
});
