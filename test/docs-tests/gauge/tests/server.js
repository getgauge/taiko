const app = require("the-internet-express");
let server;

const startServer = async () => {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(3001, resolve);
    } catch (error) {
      reject(error);
    }
  });
};

const stopServer = async () => {
  server.close((e) => {
    if (e) {
      console.error("Failed to close the Internet Express", e);
    }
  });
};

module.exports = { startServer, stopServer };
