const EventEmitter = require('events');
const util = require('util');
const { removeQuotes, symbols } = require('../lib/util');

const eventHandler = new EventEmitter();
const descEvent = new EventEmitter();
const eventRegexMap = new Map();

eventHandler.on('uncaughtException', function (err) {
  console.error(err);
});

descEvent.on('success', (desc) => {
  if (
    process.env.TAIKO_ENABLE_ACTION_OUTPUT &&
    process.env.TAIKO_ENABLE_ACTION_OUTPUT.toLowerCase() === 'true'
  ) {
    desc = symbols.pass + desc;
    desc = removeQuotes(util.inspect(desc, { colors: true }), desc);
    console.log(desc);
  }
});

/*'createdSession' is a valid event that needs more than 10 listeners as all handlers 
have to listen to it */
eventHandler.setMaxListeners(100);

module.exports = {
  eventHandler,
  descEvent,
  eventRegexMap,
};
