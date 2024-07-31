const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  textBox,
  setConfig,
  toRightOf,
  dropDown,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "isDisabled";
describe(test_name, () => {
  let innerHtml;
  let filePath;
  before(async () => {
    innerHtml = `<fieldset disabled>
      <legend>Personalia:</legend>
      Name: <input type="text"><br>
      Email: <input type="text"><br>
      Date of birth: <input type="text">
    </fieldset>
    <form action="/action_page.php">
    First name: <input type="text" name="fname"><br>
    Last name: <input type="text" name="lname" disabled><br>
    <input type="submit" value="Submit">
    <textarea disabled>
      At w3schools.com you will learn how to make a website. We offer free tutorials in all web development technologies.
      </textarea>
      <select disabled>
      <option value="volvo">Volvo</option>
      <option value="saab">Saab</option>
      <option value="mercedes">Mercedes</option>
      <option value="audi">Audi</option>
    </select>
    <select>
      <option value="volvo" disabled>Volvo</option>
      <option value="saab">Saab</option>
      <option value="mercedes">Mercedes</option>
      <option value="audi">Audi</option>
    </select>
  </form> `;
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

  it("fieldset text isDisabled()", async () => {
    expect(await textBox(toRightOf("Name:")).isDisabled()).to.be.true;
  });

  it("textBox in form isDisabled() when attribute is set", async () => {
    expect(await textBox(toRightOf("Last name:")).isDisabled()).to.be.true;
  });

  it("textBox in form isDisabled() when attribute is not set", async () => {
    expect(await textBox(toRightOf("First name:")).isDisabled()).to.be.false;
  });

  it("textArea test", async () => {
    expect(await textBox().isDisabled()).to.be.true;
  });

  it("Dropdown test", async () => {
    expect(await dropDown().isDisabled()).to.be.true;
  });
});
