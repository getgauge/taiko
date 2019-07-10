const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('uncaughtException', function (err) {
    console.error(err);
});

module.exports = emitter;