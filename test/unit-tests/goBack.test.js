const { expect } = require('chai');
const rewire = require('rewire');
let taiko = rewire('../../lib/taiko');
const test_name = 'goBack';

describe(test_name, () => {
  let actualHistoryEntryId,
    actualOptions = null;
  before(async () => {
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko.__set__('doActionAwaitingNavigation', mockWrapper);
    taiko.__set__('validate', () => {});
  });

  after(async () => {
    actualOptions = null;
  });

  describe('to about blank page', () => {
    before(async () => {
      taiko.__set__('page', {
        navigateToHistoryEntry: historyEntryId => {
          actualHistoryEntryId = historyEntryId;
        },
        getNavigationHistory: () => {
          return {
            currentIndex: 1,
            entries: [
              {
                id: 1,
                url: 'about:blank',
                userTypedURL: 'about:blank',
                title: '',
                transitionType: 'typed',
              },
              {
                id: 2,
                url: 'https://www.example.com/?gws_rd=ssl',
                userTypedURL: 'http://example.com/',
                title: 'Example',
                transitionType: 'typed',
              },
            ],
          };
        },
      });
    });
    it('should invoke navigateToHistoryEntry with correct history entry id', async () => {
      await taiko.goBack();
      expect(actualHistoryEntryId).to.be.eql({ entryId: 1 });
    });

    it('should set waitForNavigation option to false', async () => {
      await taiko.goBack();
      const expectedOptions = {
        navigationTimeout: 30000,
        waitForStart: 100,
        waitForNavigation: false,
      };
      expect(actualOptions).to.be.eql(expectedOptions);
    });

    it('should pass waitForNavigation option provided by the user', async () => {
      await taiko.goBack({
        waitForNavigation: true,
        navigationTimeout: 100,
      });
      const expectedOptions = {
        navigationTimeout: 100,
        waitForNavigation: true,
        waitForStart: 100,
      };
      expect(actualOptions).to.be.eql(expectedOptions);
    });
  });
});
