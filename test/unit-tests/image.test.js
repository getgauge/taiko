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
            <img src="avatar-blank.jpg" alt="similarImage1">
            <img src="avatar-blank.jpg" alt="similarImage2">
            <img src="avatar-blank.jpg" alt="similarImage3">
        </div>`;
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

  describe('image exists in page', () => {
    it('should find the image with text', async () => {
      expect(await image('avatar').exists()).to.be.true;
    });
    it('should find the image with selectors', async () => {
      expect(await image({ id: 'brokenImage' }).exists()).to.be.true;
      expect(await image({ src: 'brokenImage.jpg' }).exists()).to.be.true;
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

  describe('get image in page', () => {
    it('should find the image with text', async () => {
      expect(await image('avatar').get()).to.have.lengthOf(1);
    });
    it('should find the image with selectors', async () => {
      expect(await image({ id: 'brokenImage' }).get()).to.have.lengthOf(1);
      expect(await image({ src: 'brokenImage.jpg' }).get()).to.have.lengthOf(1);
    });
    it('should find the image with proximity selector', async () => {
      expect(await image(below('Images')).get()).to.have.lengthOf(7);
    });
    it('should find div image using selectors', async () => {
      expect(await image({ id: 'divImage' }).get()).to.have.lengthOf(1);
    });
    it('should find p tag image using selectors', async () => {
      expect(await image({ id: 'paraImage' }).get()).to.have.lengthOf(1);
    });
    it('should find the div image with proximity selector', async () => {
      expect(await image(below('Div Image')).get()).to.have.lengthOf(5);
    });
  });

  describe('image description in page', () => {
    it('should find the image with text', async () => {
      expect(image('avatar').description).to.be.eql("image with alt avatar ");
    });
    it('should find the image with selectors', async () => {
      expect(image({ id: 'brokenImage' }).description).to.be.eql('image[@id = concat(\'brokenImage\', "")]');
      expect(image({ src: 'brokenImage.jpg' }).description).to.be.eql('image[@src = concat(\'brokenImage.jpg\', "")]');
    });
    it('should find the image with proximity selector', async () => {
      expect(image(below('Images')).description).to.be.eql("image Below Images");
    });
    it('should find div image using selectors', async () => {
      expect(image({ id: 'divImage' }).description).to.be.eql('image[@id = concat(\'divImage\', "")]');
    });
    it('should find p tag image using selectors', async () => {
      expect(image({ id: 'paraImage' }).description).to.be.eql('image[@id = concat(\'paraImage\', "")]');
    });
    it('should find the div image with proximity selector', async () => {
      expect(image(below('Div Image')).description).to.be.eql("image Below Div Image");
    });
  });

  xdescribe('image text in page', () => { //Todo: Need to discuss on should we expose this api or not
    it('should find the image with text', async () => {
      expect(await image('avatar').text()).to.be.eql("image with alt avatar ");
    });
    it('should find the image with selectors', async () => {
      expect(await image({ id: 'brokenImage' }).text()).to.be.eql('image[@id = concat(\'brokenImage\', "")]');
      expect(await image({ src: 'brokenImage.jpg' }).text()).to.be.eql('image[@src = concat(\'brokenImage.jpg\', "")]');
    });
    it('should find the image with proximity selector', async () => {
      expect(await image(below('Images')).text()).to.be.eql("image Below Images");
    });
    it('should find div image using selectors', async () => {
      expect(await image({ id: 'divImage' }).text()).to.be.eql('image[@id = concat(\'divImage\', "")]');
    });
    it('should find p tag image using selectors', async () => {
      expect(await image({ id: 'paraImage' }).text()).to.be.eql('image[@id = concat(\'paraImage\', "")]');
    });
    it('should find the div image with proximity selector', async () => {
      expect(await image(below('Div Image')).text()).to.be.eql("image Below Div Image");
    });
  });

  describe('elements()', () => {
    it('test get of elements', async () => {
      const elements = await image('similarImage').elements();
      expect(await elements[0].get()).to.be.a('number');
      expect(await elements[1].get()).to.be.a('number');
      expect(await elements[2].get()).to.be.a('number');
    });

    it('test exists of elements', async () => {
      let elements = await image('similarImage').elements();
      expect(await elements[0].exists()).to.be.true;
      expect(await elements[1].exists()).to.be.true;
      expect(await elements[2].exists()).to.be.true;
      elements = await image('someImage').elements(null, 100, 1000);
      expect(elements).to.have.lengthOf(0);
    });

    it('test description of elements', async () => {
      let elements = await image('similarImage').elements();
      expect(elements[0].description).to.be.eql('image with alt similarImage ');
      expect(elements[1].description).to.be.eql('image with alt similarImage ');
      expect(elements[2].description).to.be.eql('image with alt similarImage ');
    });

    xit('test text of elements', async () => {
      let elements = await image('similarImage').elements();
      expect(await elements[0].text()).to.be.eql('image with alt similarImage ');
      expect(await elements[1].text()).to.be.eql('image with alt similarImage ');
      expect(await elements[2].text()).to.be.eql('image with alt similarImage ');
    }); //Todo: Need to discuss on should we expose this api or not
  });
});
