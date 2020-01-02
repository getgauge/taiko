const domHandler = require('../handlers/domHandler');
const { isElementVisible } = require('../elementSearch');
const { defaultConfig } = require('../config');
const { overlay, wait } = require('../helper');

const highlightElement = async nodeId => {
  if (defaultConfig.highlightOnAction.toLowerCase() === 'true') {
    try {
      let result = await domHandler.getBoxModel(nodeId);
      await overlay.highlightQuad({
        quad: result.model.border,
        outlineColor: { r: 255, g: 0, b: 0 },
      });
      await wait(1000);
      await overlay.hideHighlight();
    } catch (err) {
      if (await isElementVisible(nodeId)) {
        console.warn(
          'WARNING: Taiko cannot highlight hidden elements.',
        );
      } else {
        throw err;
      }
    }
  }
};
module.exports = { highlightElement };
