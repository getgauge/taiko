const EventEmitter = require('events').EventEmitter;
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko.js');
let {
  openBrowser,
  goto,
  below,
  dropDown,
  closeBrowser,
  setConfig,
} = taiko;
const expect = require('chai').expect;
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = 'DropDown';

describe(test_name, () => {
  let filePath;
  let actualEmmiter;
  let emitter = new EventEmitter();

  let validateEmitterEvent = function(event, expectedText) {
    return new Promise(resolve => {
      emitter.on(event, eventData => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  };

  before(async () => {
    actualEmmiter = taiko.__get__('descEvent');

    taiko.__set__('descEvent', emitter);

    let innerHtml =
      '<form>' +
      '<label for="select">Cars</label>' +
      '<select id="select" name="select" value="select">' +
      '<option value="volvo">Volvo</option>' +
      '<option value="saab">Saab</option>' +
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
      '<label for="selectDisabled">CarsDisabled</label>' +
      '<select id="selectDisabled" name="selectDisabled" value="selectDisabled" disabled>' +
      '<option value="volvo">Volvo</option>' +
      '<option value="saab">Saab</option>' +
      '<option value="mercedes">Mercedes</option>' +
      '<option value="audi">Audi</option>' +
      '</select>' +
      '<label>' +
      '<span>dropDownWithWrappedInLabelDisabled</span>' +
      '<select id="selectDisabled" name="selectDisabled" value="selectDisabled" disabled>' +
      '<option value="volvo1">Volvo1</option>' +
      '<option value="saab1">Saab1</option>' +
      '<option value="mercedes1">Mercedes1</option>' +
      '<option value="audi1">Audi1</option>' +
      '</select>' +
      '</label>' +
      '</form>';
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    await setConfig({ waitForNavigation: false });
  });

  after(async () => {
    await setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
    taiko.__set__('descEvent', actualEmmiter);
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  describe('using label for', () => {
    it('test dropdown exists()', async () => {
      expect(await dropDown('Cars').exists()).to.be.true;
    });

    it('test dropdown isDisabled()', async () => {
      expect(await dropDown('CarsDisabled').isDisabled()).to.be.true;
    });

    it('test select()', async () => {
      await dropDown('Cars').select('Audi');
      await dropDown('Cars').select('mercedes');
      expect(await dropDown('Cars').value()).to.equal('mercedes');
    });
  });

  describe('Select using index', () => {
    it('test select() using index', async () => {
      await dropDown(below('Reason')).select({ index: 1 });
      expect(await dropDown(below('Reason')).value()).to.equal(
        '9092',
      );
    });
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(await dropDown('dropDownWithWrappedInLabel').exists()).to
        .be.true;
      expect(
        await dropDown('dropDownWithWrappedInLabel').value(),
      ).to.not.equal('mercedes');
    });

    it('test isDisabled()', async () => {
      expect(await dropDown('dropDownWithWrappedInLabelDisabled').isDisabled()).to
        .be.true;
    });
  });

  describe('test logs for dropdown', () => {
    it('should show exists', async () => {
      let validatePromise = validateEmitterEvent('success', 'Exists');
      await dropDown('Cars').exists();
      await validatePromise;
    });

    it('should show selected index', async () => {
      let validatePromise = validateEmitterEvent(
        'success',
        'Selected 1',
      );
      await dropDown(below('Reason')).select({ index: 1 });
      await validatePromise;
    });

    it('should show selected value', async () => {
      let validatePromise = validateEmitterEvent(
        'success',
        'Selected mercedes',
      );
      await dropDown('Cars').select('mercedes');
      await validatePromise;
    });
  });
});
