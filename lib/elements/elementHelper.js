const domHandler = require('../handlers/domHandler');
const { defaultConfig } = require('../config');
const { highlightQuad, hideHighlight } = require('../handlers/overlayHandler');
const { wait } = require('../helper');

const highlightElement = async element => {
  if (defaultConfig.highlightOnAction.toLowerCase() === 'true') {
    try {
      let result = await domHandler.getBoxModel(element.get());
      await highlightQuad(result.model.border);
      await wait(1000);
      await hideHighlight();
    } catch (err) {
      if (await element.isVisible()) {
        console.warn('WARNING: Taiko cannot highlight hidden elements.');
      } else {
        throw err;
      }
    }
  }
};
module.exports = { highlightElement };
