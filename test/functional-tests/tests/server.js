const app = require('the-internet-express');
let server;

const startServer = async () => {
  server = app.listen(3001);
};
const stopServer = async () => {
  server.close(e => {
    if (e) {
      console.error('Failed to close the Internet Express', e);
    }
  });
};

module.exports = { startServer, stopServer };
