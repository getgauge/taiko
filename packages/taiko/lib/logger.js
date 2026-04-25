const debug = require("debug");
const logEvent = debug("taiko:event");
const logQuery = debug("taiko:query");
const logIntercept = debug("taiko:intercept");

module.exports = {
  logEvent,
  logQuery,
  logIntercept,
};
