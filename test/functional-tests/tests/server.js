const app = require("the-internet-express");
const express = require("express");
const path = require("path");

const fileApp = express();
let ieServer, filesServer;

fileApp.use("/", express.static(path.join(__dirname, "../specs/data")));

const startServer = async () => {
  return new Promise((resolve, reject) => {
    try {
      ieServer = app.listen(3001, resolve);
      filesServer = fileApp.listen(3002, resolve);
    } catch (error) {
      reject(error);
    }
  });
};

const stopServer = async () => {
  ieServer.close((e) => {
    if (e) {
      console.error("Failed to close the Internet Express", e);
    }
  });

  filesServer.close((e) => {
    if (e) {
      console.error(
        "Failed to close local file server running on specs/data",
        e,
      );
    }
  });
};

module.exports = { startServer, stopServer };
