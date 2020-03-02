const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  closeBrowser,
  goto,
  textBox,
  setConfig,
  toRightOf,
  dropDown,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
let test_name = 'tsesr';
describe('Disable fieldset test', () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = `<fieldset disabled>
        <legend>Personalia:</legend>
        Name: <input type="text"><br>
        Email: <input type="text"><br>
        Date of birth: <input type="text">
      </fieldset>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false, retryTimeout: 100, retryInterval: 10 });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  it('fieldset text isDisabled()', async () => {
    expect(await textBox(toRightOf('Name:')).isDisabled()).to.be.true;
  });
});

describe('Disable fieldset test', () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = `
      <form action="/action_page.php">
        First name: <input type="text" name="fname"><br>
        Last name: <input type="text" name="lname" disabled><br>
        <input type="submit" value="Submit">
      </form> `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false, retryTimeout: 100, retryInterval: 10 });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  it('textBox in form isDisabled() when attribute is set', async () => {
    expect(await textBox(toRightOf('Last name:')).isDisabled()).to.be.true;
  });

  it('textBox in form isDisabled() when attribute is not set', async () => {
    expect(await textBox(toRightOf('First name:')).isDisabled()).to.be.false;
  });
});

describe('Disable textArea test', () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = ` <textarea disabled>
      At w3schools.com you will learn how to make a website. We offer free tutorials in all web development technologies.
      </textarea>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false, retryTimeout: 100, retryInterval: 10 });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  it('textArea isDisabled()', async () => {
    expect(await textBox().isDisabled()).to.be.true;
  });
});

describe('Disable dropDown test', () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = ` <select disabled>
      <option value="volvo">Volvo</option>
      <option value="saab">Saab</option>
      <option value="mercedes">Mercedes</option>
      <option value="audi">Audi</option>
    </select>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false, retryTimeout: 100, retryInterval: 10 });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  it('Dropdown isDisabled()', async () => {
    expect(await dropDown().isDisabled()).to.be.true;
  });
});

describe('Disable dropDown option test', () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = ` <select>
      <option value="volvo" disabled>Volvo</option>
      <option value="saab">Saab</option>
      <option value="mercedes">Mercedes</option>
      <option value="audi">Audi</option>
    </select>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false, retryTimeout: 100, retryInterval: 10 });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });
});
