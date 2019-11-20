const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  goto,
  listItem,
  setConfig,
} = require('../../lib/taiko');

let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');

const test_name = 'list Item';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
      <ul>
        <li id="coffee">Coffee</li>
        <li>Tea</li>
        <li>Milk</li>
      </ul>
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

  describe('test node', () => {
    it('test exists()', async () => {
      expect(await listItem({ id: 'coffee' }).exists()).to.be.true;
    });

    it('test description', async () => {
      expect(listItem({ id: 'coffee' }).description).to.be.eql(
        `list Item[@id = concat(\'coffee\', "")]`,
      );
    });

    it('test text()', async () => {
      expect(await listItem({ id: 'coffee' }).text()).to.be.eql(
        'Coffee',
      );
    });
  });

  describe('test elementsList properties', () => {
    it('test get()', async () => {
      const elems = await listItem({ id: 'coffee' }).elements();
      expect(await elems[0].get()).to.be.a('number');
    });

    it('test description', async () => {
      const elems = await listItem({ id: 'coffee' }).elements();
      expect(elems[0].description).to.be.eql(
        `list Item[@id = concat(\'coffee\', "")]`,
      );
    });

    it('test text()', async () => {
      const elems = await listItem({ id: 'coffee' }).elements();
      expect(await elems[0].text()).to.be.eql('Coffee');
    });
  });
});
