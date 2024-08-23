const { openBrowser, closeBrowser, screencast } = require("taiko");
const { startScreencast, stopScreencast } = screencast;

const screenCastEnabled =
  process.env.SCREENCAST_ENABLED.toLowerCase() === "true";

module.exports.openBrowserAndStartScreencast = async (outFile) => {
  await openBrowser({ args: ["--no-first-run", "--no-sandbox"] });
  if (screenCastEnabled) {
    await startScreencast(outFile);
  }
};

module.exports.closeBrowserAndStopScreencast = async () => {
  if (screenCastEnabled) {
    await stopScreencast();
  }
  await closeBrowser();
};
