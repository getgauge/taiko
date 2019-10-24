const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  goto,
  image,
  below,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = 'image';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <div class="example">
            <h3>Images</h3>
            <img src="brokenImage.jpg" id="brokenImage">
            <img src="avatar-blank.jpg" alt="avatar">
            <h3>Div Image</h3>
            <div id="divImage" style="background-image: url('image.png')"></div>
            <p id="paraImage" style="background-image: url('something.png')">okay</p>
        </div>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false });
  });

  after(async () => {
    setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });

  describe('image exists in page', () => {
    it('should find the image with text', async () => {
      expect(await image('avatar').exists()).to.be.true;
    });
    it('should find the image with selectors', async () => {
      expect(await image({ id: 'brokenImage' }).exists()).to.be.true;
      expect(await image({ src: 'brokenImage.jpg' }).exists()).to.be
        .true;
    });
    it('should find the image with proximity selector', async () => {
      expect(await image(below('Images')).exists()).to.be.true;
    });
    it('should find div image using selectors', async () => {
      expect(await image({ id: 'divImage' }).exists()).to.be.true;
    });
    it('should find p tag image using selectors', async () => {
      expect(await image({ id: 'paraImage' }).exists()).to.be.true;
    });
    it('should find the div image with proximity selector', async () => {
      expect(await image(below('Div Image')).exists()).to.be.true;
    });
  });
});
