const expect = require('chai').expect;
const { EventEmitter } = require('events');
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
const targetHandler = rewire('../../lib/handlers/targetHandler');

describe('closeTab', () => {
  let _targets = { matching: [], others: [] };
  let currentURL = '';
  let _isMatchUrl = false;
  let _isMatchRegex = false;
  let currentTarget;
  let descEmmitter = new EventEmitter();

  let validateEmitterEvent = function(event, expectedText) {
    return new Promise(resolve => {
      descEmmitter.on(event, eventData => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  };

  before(() => {
    let mockCri = {
      Close: async function() {},
    };

    let mockHandler = {
      getCriTargets: () => {
        return _targets;
      },
      constructCriTarget: arg => {
        return arg;
      },
      isMatchingUrl: () => {
        return _isMatchUrl;
      },
      isMatchingRegex: () => {
        return _isMatchRegex;
      },
    };

    taiko.__set__('validate', () => {});
    taiko.__set__('currentURL', () => currentURL);
    targetHandler.__set__('cri', mockCri);
    taiko.__set__('targetHandler', mockHandler);
    taiko.__set__('descEvent', descEmmitter);
    taiko.__set__('cri', mockCri);
    taiko.__set__('connect_to_cri', async target => {
      currentTarget = target;
    });
    taiko.__set__('dom', { getDocument: async () => {} });
  });

  beforeEach(() => {
    descEmmitter.removeAllListeners();
    taiko.__set__('_client', new EventEmitter());
    _targets = { matching: [], others: [] };
  });

  it('should close the browser if there are no tabs to reconnect', async () => {
    taiko.__set__('_closeBrowser', () => {});
    let validatePromise = validateEmitterEvent('success', 'Closing last target and browser.');
    await taiko.closeTab();
    await validatePromise;
  });

  it('should close the current tab and switch to last active target if no url given', async () => {
    _targets.matching.push({
      id: '1',
      type: 'page',
      url: 'https://flipkart.com',
    });
    _targets.others.push({
      id: '2',
      type: 'page',
      url: 'https://flipkart.com',
    });
    _targets.others.push({
      id: '3',
      type: 'page',
      url: 'https://amazon.com',
    });
    currentURL = 'https://amazon.com';
    _isMatchUrl = false;
    _isMatchRegex = false;
    let validatePromise = validateEmitterEvent(
      'success',
      'Closed current tab matching https://flipkart.com',
    );
    await taiko.closeTab();
    await validatePromise;
    expect(currentTarget.url).to.be.eql('https://flipkart.com');
  });

  it('should close the all matching tabs with given url switch to last active', async () => {
    _targets.matching.push({
      id: '1',
      type: 'page',
      url: 'https://flipkart.com',
    });
    _targets.others.push({
      id: '2',
      type: 'page',
      url: 'https://amazon.com',
    });
    _targets.matching.push({
      id: '3',
      type: 'page',
      url: 'https://flipkart.com',
    });
    currentURL = 'https://flipkart.com';
    _isMatchUrl = false;
    _isMatchRegex = false;

    let validatePromise = validateEmitterEvent(
      'success',
      'Closed tab(s) matching https://flipkart.com',
    );
    await taiko.closeTab('https://flipkart.com');
    await validatePromise;
    expect(currentTarget.url).to.be.eql('https://amazon.com');
  });
  it('should close all matching tabs if target is non active tab', async () => {
    _targets.matching.push({
      id: '1',
      type: 'page',
      url: 'https://flipkart.com',
    });
    _targets.others.push({
      id: '2',
      type: 'page',
      url: 'https://flipkart.com',
    });
    _targets.others.push({
      id: '3',
      type: 'page',
      url: 'https://amazon.com',
    });
    currentURL = 'https://amazon.com';
    _isMatchUrl = true;
    _isMatchRegex = false;

    let validatePromise = validateEmitterEvent(
      'success',
      'Closed tab(s) matching https://flipkart.com',
    );
    await taiko.closeTab('https://flipkart.com');
    await validatePromise;
    expect(currentTarget.url).to.be.eql('https://amazon.com');
  });
  it('should close all matching tabs for given regex', async () => {
    _targets.matching.push({
      id: '1',
      type: 'page',
      url: 'https://www.google.com',
    });
    _targets.matching.push({
      id: '2',
      type: 'page',
      url: 'https://www.google.co.uk',
    });
    _targets.others.push({
      id: '3',
      type: 'page',
      url: 'https://amazon.com',
    });
    currentURL = 'https://amazon.com';
    _isMatchUrl = false;
    _isMatchRegex = false;

    let validatePromise = validateEmitterEvent(
      'success',
      'Closed tab(s) matching /http(s?):\\/\\/(www?).google.(com|co.in|co.uk)/',
    );
    await taiko.closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/);
    await validatePromise;
    expect(currentTarget.url).to.be.eql('https://amazon.com');
  });
});
