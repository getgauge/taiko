const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('uncaughtException', function(err) {
  console.error(err);
});

/*'createdSession' is a valid event that needs more than 10 listeners as all handlers 
have to listen to it */
emitter.setMaxListeners(20);

module.exports = emitter;
