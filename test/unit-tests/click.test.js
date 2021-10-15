const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  click,
  closeBrowser,
  goto,
  text,
  button,
  below,
  setConfig,
  accept,
  alert,
  openIncognitoWindow,
  closeIncognitoWindow,
  scrollTo,
  screenshot,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = 'Click';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
            <span>Click with proximity</span>
            <div>
                <span onclick="displayText('Click works with text nodes.')">Click on text node</span>
                <span>Click with proximity</span>
            </div>
            <div>
                <input type="checkbox" onclick="displayText('Click works with ghost element covering text.')"
                   style="
                        opacity:0.01;
                        width:400px;
                        height:20px;
                        position: absolute
                   "
                   />
                <span class='b'>Click ghost element covering text.</span>
            </div>
            </div>
            <span>Proximity marker</span>
            <input onclick="displayText('Click works with text as value.')" value="Text as value"/><br/>
            <input onclick="displayText('Click works with text as type.')" type="Text as type"/><br/>
            <span onclick="displayText('Click works with proximity selector.')">Click with proximity</span>
            <div onclick="displayText('Click works with text accross element.')">
                Text <span>accross</span> elements
            </div>
            <script type="text/javascript">
                function displayText(text) {
                    document.getElementById('root').innerText = text
                }
            </script>
            <div style="height:1500px"></div>
            <div id="root" style="background:red;"></div>
            <span onclick="displayText('Click works with auto scroll.')">Show Message</span>
            <style>
                .overlayContainer{
                  position:relative;
                }
                .overlay {
                  position: absolute;
                  top:0;
                  left:0;
                  width:100%;
                  height:100%;
                  text-align:center;
                }
            </style>
            <div class="overlayContainer">
                <div class='a'>Click Element covered</div>
                <span class='overlay'></span>
            </div>
            <button type="button" disabled>Click Me!</button>
            <script>
    class ShadowButton extends HTMLElement {
      constructor() {
        super();
        var shadow = this.attachShadow({mode: 'open'});

        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Shadow Click');
        button.addEventListener("click", event => {
          alert("Hello from the shadows");
        });
        shadow.appendChild(button);
        
      }
    }
    customElements.define('shadow-button', ShadowButton);
  </script>
  <shadow-button>
            `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
  });

  beforeEach(async () => {
    await openIncognitoWindow(filePath, { name: 'admin' });
    setConfig({
      waitForNavigation: false,
      retryTimeout: 10,
      retryInterval: 10,
    });
  });

  afterEach(async function () {
    await closeIncognitoWindow('admin');
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  describe('scroll to click', () => {
    it('test if auto scrolls to element before clicking', async () => {
      await click('Show Message');
      expect(await text('Click works with auto scroll.').exists()).to.be.true;
    });
  });

  describe('With text nodes', () => {
    it('should click', async () => {
      await click('on text');
      expect(await text('Click works with text nodes.').exists()).to.be.true;
    });
  });

  describe('element inside shadow dom', () => {
    it('should click', async () => {
      alert('Hello from the shadows', async () => {
        await accept();
      });
      await scrollTo('Shadow Click');
      await click(button('Shadow Click'));
    });
  });

  describe('With proximity selector', () => {
    it('should click', async () => {
      await click('Click with proximity', below('Proximity marker'));
      expect(await text('Click works with proximity selector.').exists()).to.be.true;
    });
  });

  describe('Text accross element', () => {
    it('should click', async () => {
      await click('Text accross elements');
      expect(await text('Click works with text accross element.').exists()).to.be.true;
    });
  });

  describe('Text as value', () => {
    it('should click', async () => {
      await click('Text as value');
      expect(await text('Click works with text as value.').exists()).to.be.true;
    });
  });

  describe('With ghost element', () => {
    it('should click the ghost element', async () => {
      await click('Click ghost element covering text');
      expect(await text('Click works with ghost element covering text.').exists()).to.be.true;
    });

    describe('With element covered by an overlay', () => {
      it('should throw error', async () => {
        await expect(click('Click Element covered')).to.be.rejectedWith(
          'Element matching text "Click Element covered" is covered by other element',
        );
      });
    });
    describe('With element disabled', () => {
      it('should throw error if element is disabled', async () => {
        await expect(click(button('Click me'))).to.be.rejectedWith(
          'Button with label Click me is disabled',
        );
      });
      it('should click when forced', async () => {
        await expect(click(button('Click me'), { force: true })).eventually.fulfilled;
      });
    });
  });
});
