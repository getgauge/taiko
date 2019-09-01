const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

let {
  openBrowser,
  goto,
  textBox,
  closeBrowser,
  clear,
  setConfig,
  reload,
  write,
  into,
  $,
} = require('../../lib/taiko');
let {
  createHtml,
  openBrowserArgs,
  removeFile,
} = require('./test-util');
const test_name = 'Clear';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <form>
            <p>
                <label for="name">
                    Name<input type="text" name="user[name]" id="user[name]" value="Example" disabled/>
                </label>
                <label for="email">
                    Email<input type="text" name="user[email]" id="user[email]" value="example@test.com"/>
                </label>
                <label for="address">
                    Address
                    <textarea name="user[address]" id="user[address]">Address in
multiple lines.</textarea>
                </label>

                <label for="country">
                        Country<input type="text" name="user[country]" id="user[country]" value="" onkeyup="displayInfo(this)"/>
                </label>
                <input type="text" id="disabled" value="Example" disabled/>
            </p>
        </form>
        <div id='info-borad' ></div>
        <script type="text/javascript">
            setTimeout( () => {
                document.getElementById('user[name]').disabled = false;
            }, 100);

            function displayInfo(element) {
                console.log(element)
                console.log(element.value)
                document.getElementById('info-borad').innerText  = element.value;
            }
        </script>
        `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    await setConfig({ waitForNavigation: false });
  });

  after(async () => {
    await setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });

  describe('input field', () => {
    it('should clear content', async () => {
      expect(await textBox('Email').value()).to.equal(
        'example@test.com',
      );
      await clear(textBox('Email'));
      expect(await textBox('Email').value()).to.equal('');
    });

    it('should throw error for disabled', async () => {
      await expect(
        clear(textBox({ id: 'disabled' })),
      ).to.eventually.be.rejectedWith('Element cannot be cleared');
    });

    it('should wait for input to be clearable', async () => {
      await reload();
      expect(await textBox('Name').value()).to.equal('Example');
      await clear(textBox('Name'));
      expect(await textBox('Name').value()).to.equal('');
    });
  });

  describe('textarea', () => {
    it('should clear whole content', async () => {
      await reload();
      expect(await textBox('Address').value()).to.equal(
        'Address in\nmultiple lines.',
      );
      await clear(textBox('Address'));
      expect(await textBox('Address').value()).to.equal('');
    });
  });

  describe('events', () => {
    it('should be trigged after clearing textbox', async () => {
      await reload();
      await write('No man land', into(textBox('Country')));
      expect((await $('#info-borad').text())[0]).to.equal(
        'No man land',
      );
      await clear(textBox('Country'));
      expect((await $('#info-borad').text())[0]).to.equal('');
    });
  });
});
