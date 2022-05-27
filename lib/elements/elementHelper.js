const domHandler = require('../handlers/domHandler');
const { defaultConfig } = require('../config');
const overlayHandler = require('../handlers/overlayHandler');
const { wait } = require('../helper');

const highlightElement = async (element) => {
  // Adding a wait as tests fail on newer versions of chrome
  if (!defaultConfig.highlightOnAction) {
    await wait(1000);
    return
  }

  if (await element.isVisible()) {
    let result = await domHandler.getBoxModel(element.get());
    await overlayHandler.highlightQuad(result.model.border);
    await wait(1000);
    await overlayHandler.hideHighlight();
  } else {
    console.warn('WARNING: Taiko cannot highlight hidden elements.');
  }
};

module.exports = { highlightElement };
