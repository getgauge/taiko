const expect = require('chai').expect;
let rewire = require('rewire');

describe('TargetHandler', () => {
  describe('.getCriTargets', () => {
    let _targets = [],
      targetHandler;

    before(() => {
      targetHandler = rewire('../../../lib/handlers/targetHandler');
      let mockCri = {
        List: function () {
          return _targets.reverse();
        },
      };
      targetHandler.__set__('cri', mockCri);
    });

    after(() => {
      const createdSessionListener = targetHandler.__get__('createdSessionListener');
      targetHandler
        .__get__('eventHandler')
        .removeListener('createdSession', createdSessionListener);
      targetHandler = rewire('../../../lib/handlers/targetHandler');
      targetHandler
        .__get__('eventHandler')
        .removeListener('createdSession', createdSessionListener);
    });

    beforeEach(() => {
      _targets = [];
    });
    it('should give current tab as matching if no url given', async () => {
      _targets.push({ id: '1', type: 'page' });
      _targets.push({ id: '2', type: 'page' });
      targetHandler.__set__('activeTargetId', '2');
      let targets = await targetHandler.getCriTargets();
      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].id).to.be.equal('2');
      expect(targets.others.length).to.be.equal(1);
      expect(targets.others[0].id).to.be.equal('1');
    });

    it('should create target and return target id on createTarget call', async () => {
      targetHandler.__set__('browserDebugUrlTarget', {
        createTarget: async () => {
          return { targetId: 'id1' };
        },
      });
      const actualTargetId = await targetHandler.createTarget('url');
      expect(actualTargetId).to.equal('id1');
    });

    it('should give all the matching tabs if regex is given', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://www.google.com',
        title: 'Google',
      });
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://www.google.co.uk',
        title: 'Google',
      });
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://www.github.com',
        title: 'The world’s leading software development platform · GitHub',
      });

      let targets = await targetHandler.getCriTargets(
        /http(s?):\/\/(www?).google.(com|co.in|co.uk)/,
      );

      expect(targets.matching.length).to.be.equal(2);

      let someOtherTarget = await targetHandler.getCriTargets(/Go*gle/);

      expect(someOtherTarget.matching.length).to.be.equal(2);
    });

    it('should give all matching tabs if url is given without protocol ', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://flipkart.com/a/c',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'https://amazon.com',
      });
      _targets.push({
        id: '3',
        type: 'page',
        url: 'https://flipkart.com/a/b',
      });

      let targets = await targetHandler.getCriTargets('flipkart.com/a/b');

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].id).to.be.equal('3');
      expect(targets.matching[0].url).to.be.equal('https://flipkart.com/a/b');
      expect(targets.others.length).to.be.equal(2);
      expect(targets.others[0].url).to.be.equal('https://amazon.com');
    });

    it('should give all matching tabs if url is given with multi path ', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://flipkart.com/a/c',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'https://amazon.com',
      });
      _targets.push({
        id: '3',
        type: 'page',
        url: 'https://flipkart.com/a/b',
      });

      let targets = await targetHandler.getCriTargets('https://flipkart.com/a/b');

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].id).to.be.equal('3');
      expect(targets.matching[0].url).to.be.equal('https://flipkart.com/a/b');
      expect(targets.others.length).to.be.equal(2);
      expect(targets.others[0].url).to.be.equal('https://amazon.com');
    });

    it('should give all matching tabs if host is given', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://flipkart.com',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'https://amazon.com',
      });
      _targets.push({
        id: '3',
        type: 'page',
        url: 'https://flipkart.com',
      });

      let targets = await targetHandler.getCriTargets('flipkart.com');

      expect(targets.matching.length).to.be.equal(2);
      expect(targets.matching[0].id).to.be.equal('3');
      expect(targets.matching[0].url).to.be.equal('https://flipkart.com');
      expect(targets.others.length).to.be.equal(1);
      expect(targets.others[0].url).to.be.equal('https://amazon.com');
    });

    it('should give no matching tabs if given url does not exists', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://flipkart.com',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'https://amazon.com',
      });
      _targets.push({
        id: '3',
        type: 'page',
        url: 'https://flipkart.com',
      });

      let targets = await targetHandler.getCriTargets('gauge.org');

      expect(targets.matching.length).to.be.equal(0);
      expect(targets.others.length).to.be.equal(3);
    });
    it('should give the matching tab for regex Title', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'https://google.com',
        title: 'Google',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'https://github.com',
        title: 'The world’s leading software development platform · GitHub',
      });
      let targets = await targetHandler.getCriTargets(/Go*gle/);
      expect(targets.matching.length).to.be.equal(1);
      expect(targets.others.length).to.be.equal(1);
    });

    it('should give all matching tabs if targets has blank page', async () => {
      _targets.push({
        id: '1',
        type: 'page',
        url: 'http://localhost:3001/windows',
      });
      _targets.push({
        id: '2',
        type: 'page',
        url: 'http://localhost:3001/windows/new',
      });
      _targets.push({
        id: '3',
        type: 'page',
        url: 'about:blank',
      });
      let targets = await targetHandler.getCriTargets('http://localhost:3001/windows');

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].id).to.be.equal('1');
      expect(targets.others.length).to.be.equal(2);
    });
  });

  describe('register and unregister', () => {
    let targetHandler;

    beforeEach(() => {
      targetHandler = new require('../../../lib/handlers/targetHandler');
    });

    afterEach(() => {
      targetHandler.clearRegister();
    });

    it('should register a target with name', async () => {
      targetHandler.register('one', { id: 'first', type: 'page' });
      targetHandler.register('two', { id: 'second', type: 'page' });
      expect(targetHandler.register('two').id).to.be.equal('second');
    });

    it('should unregister a tab with the given name', async () => {
      targetHandler.register('one', { id: 'first', type: 'page' });
      targetHandler.register('two', { id: 'second', type: 'page' });

      targetHandler.unregister('one');

      expect(targetHandler.register('one')).to.be.undefined;
      expect(targetHandler.register('two').id).to.equal('second');
    });
  });
});
