const EventEmitter = require('events');
const eventHandler = new EventEmitter();
const descEvent = new EventEmitter();

eventHandler.on('uncaughtException', function (err) {
  console.error(err);
});

/*'createdSession' is a valid event that needs more than 10 listeners as all handlers 
have to listen to it */
eventHandler.setMaxListeners(20);

module.exports = {
  eventHandler,
  descEvent,
};
