const { descEvent } = require('../../lib/helper');

let { openBrowser, goto, below, dropDown, closeBrowser, setConfig } = require('../../lib/taiko');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = 'DropDown';

describe(test_name, () => {
  let filePath;

  let validateEmitterEvent = function(event, expectedText) {
    return new Promise(resolve => {
      descEvent.once(event, eventData => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  };

  before(async () => {
    let innerHtml =
      '<form>' +
      '<label for="select">Cars</label>' +
      '<select id="select" name="select" value="select">' +
      '<option value="volvo">Volvo</option>' +
      '<option value="saab" disabled>Saab</option>' +
      '<option value="mercedes">Mercedes</option>' +
      '<option value="audi">Audi</option>' +
      '</select>' +
      '<div name="ReasonText"> Reason: </div>' +
      '<select class="select" name="reasonselection">' +
      '<option value="-99"> Select </option>' +
      '<option value="9092">Reason1</option>' +
      '<option value="9093">Reason2</option>' +
      '</select>' +
      '<label>' +
      '<span>dropDownWithWrappedInLabel</span>' +
      '<select id="select" name="select" value="select">' +
      '<option value="volvo1">Volvo1</option>' +
      '<option value="saab1">Saab1</option>' +
      '<option value="mercedes1">Mercedes1</option>' +
      '<option value="audi1">Audi1</option>' +
      '</select>' +
      '</label>' +
      '<select id="sampleDropDown" name="select" value="select">' +
      '<option value="someValue">someValue</option>' +
      '</select>' +
      '</form>';
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

  describe('using label for', () => {
    it('test dropdown exists()', async () => {
      expect(await dropDown('Cars').exists()).to.be.true;
    });

    it('test dropdown description', async () => {
      expect(dropDown('Cars').description).to.be.eql('DropDown with label Cars ');
    });

    it('test dropdown text()', async () => {
      expect(await dropDown('Cars').text()).to.be.eql('Volvo\nSaab\nMercedes\nAudi');
    });

    it('test text should throw if the element is not found', async () => {
      await expect(dropDown('.foo').text()).to.be.eventually.rejectedWith(
        'DropDown with label .foo  not found',
      );
    });

    it('test select()', async () => {
      await dropDown('Cars').select('Audi');
      await dropDown('Cars').select('mercedes');
      expect(await dropDown('Cars').value()).to.equal('mercedes');
    });

    it('test select() should thrown when selecting on disabled option', async () => {
      try {
        expect(await dropDown('Cars').select('Saab'));
      } catch (err) {
        expect(err.message).to.equal('Cannot set value Saab on a disabled field');
      }
    });
  });

  describe('Select using index', () => {
    it('test select() using index', async () => {
      await dropDown(below('Reason')).select({ index: 1 });
      expect(await dropDown(below('Reason')).value()).to.equal('9092');
    });
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(await dropDown('dropDownWithWrappedInLabel').exists()).to.be.true;
      expect(await dropDown('dropDownWithWrappedInLabel').value()).to.not.equal('mercedes');
    });

    it('test description', async () => {
      expect(dropDown('dropDownWithWrappedInLabel').description).to.be.eql(
        'DropDown with label dropDownWithWrappedInLabel ',
      );
    });

    it('test text()', async () => {
      expect(await dropDown('dropDownWithWrappedInLabel').text()).to.be.eql(
        'Volvo1\nSaab1\nMercedes1\nAudi1',
      );
    });
  });

  describe('test logs for dropdown', () => {
    it('should show exists', async () => {
      let validatePromise = validateEmitterEvent('success', 'Exists');
      await dropDown('Cars').exists();
      await validatePromise;
    });

    it('should show selected index', async () => {
      let validatePromise = validateEmitterEvent('success', 'Selected 1');
      await dropDown(below('Reason')).select({ index: 1 });
      await validatePromise;
    });

    it('should show selected value', async () => {
      let validatePromise = validateEmitterEvent('success', 'Selected mercedes');
      await dropDown('Cars').select('mercedes');
      await validatePromise;
    });
  });

  describe('test elementList properties', () => {
    it('test get of elements', async () => {
      const elements = await dropDown({
        id: 'sampleDropDown',
      }).elements();
      expect(elements[0].get())
        .to.be.a('number')
        .above(0);
    });

    it('test description of elements', async () => {
      let elements = await dropDown({
        id: 'sampleDropDown',
      }).elements();
      expect(elements[0].description).to.be.eql('DropDown[@id = concat(\'sampleDropDown\', "")]');
    });

    it('test text of elements', async () => {
      let elements = await dropDown({
        id: 'sampleDropDown',
      }).elements();
      expect(await elements[0].text()).to.be.eql('someValue');
    });

    it('test select of elements', async () => {
      let validatePromise = validateEmitterEvent('success', 'Selected someValue');
      let elements = await dropDown({
        id: 'sampleDropDown',
      }).elements();
      await elements[0].select('someValue');
      await validatePromise;
    });

    it('test get value of elements', async () => {
      let elements = await dropDown({
        id: 'sampleDropDown',
      }).elements();
      await elements[0].select('someValue');
      expect(await elements[0].value()).to.equal('someValue');
    });
  });
});

describe('nested drop down', () => {
  let filePath;

  before(async () => {
    let innerHtml = `<div id="one">
    <label for="select-one">One</label>
    <select id="select-one" name="select" value="select">
       <option>Select One</option> 
       <option>Hot Beverages</option>
      </select>
  </div>
  <div id="two">
    <label for="select-two">Two</label>
    <select id="select-two" name="select" value="select">
       <option>Please select from above</option>
      </select>
  </div>
  <script>
    var textTwo = document.getElementById("select-two");
  var divOne = document.getElementById("one");

  divOne.addEventListener("change", function() {
    console.log("Hello");
    textTwo.innerHTML = "<option>Tea</option><option>Cofee</option>";
  });
  </script>`;
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

  it('should bubble change event', async () => {
    await dropDown('One').select('Hot Beverages');
    await expect(dropDown('Two').select('Tea')).not.to.be.eventually.rejected;
  });
});
