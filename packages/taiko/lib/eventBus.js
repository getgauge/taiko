const EventEmitter = require("node:events");
const util = require("node:util");
const { removeQuotes, symbols } = require("../lib/util");

const eventHandler = new EventEmitter();
const descEvent = new EventEmitter();
const eventRegexMap = new Map();

eventHandler.on("uncaughtException", (err) => {
  console.error(err);
});

descEvent.on("success", (desc) => {
  if (
    process.env.TAIKO_ENABLE_ACTION_OUTPUT &&
    process.env.TAIKO_ENABLE_ACTION_OUTPUT.toLowerCase() === "true"
  ) {
    const outputDesc = removeQuotes(
      util.inspect(symbols.pass + desc, { colors: true }),
      symbols.pass + desc,
    );
    console.log(outputDesc);
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
