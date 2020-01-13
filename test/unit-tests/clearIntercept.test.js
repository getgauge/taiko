const expect = require('chai').expect;
const { EventEmitter } = require('events');
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');

describe('clearIntercept', () => {
  let validateEmitterEvent;
  beforeEach(() => {
    validateEmitterEvent = function(event, expectedText) {
      let descEmitter = new EventEmitter();
      taiko.__set__('descEvent', descEmitter);
      return new Promise(resolve => {
        descEmitter.on(event, eventData => {
          expect(eventData).to.be.equal(expectedText);
          resolve();
        });
      });
    };
  });

  it('should display success message if there are intercepts for the url', async () => {
    let validatePromise = validateEmitterEvent('success', 'Intercepts reset for url google.com');
    let networkHandler = {
      resetInterceptor: () => true,
    };
    taiko.__set__('networkHandler', networkHandler);
    await taiko.clearIntercept('google.com');
    await validatePromise;
  });

  it('should display message if all intercepts are reset', async () => {
    let validatePromise = validateEmitterEvent('success', 'Intercepts reset for all url');
    let networkHandler = {
      resetInterceptors: () => {},
    };
    taiko.__set__('networkHandler', networkHandler);
    await taiko.clearIntercept();
    await validatePromise;
  });
  it('should display failure message if there are no intercepts for the url', async () => {
    let validatePromise = validateEmitterEvent(
      'success',
      'Intercepts not found for url google.com',
    );
    let networkHandler = {
      resetInterceptor: () => false,
    };
    taiko.__set__('networkHandler', networkHandler);
    await taiko.clearIntercept('google.com');
    await validatePromise;
  });
});
