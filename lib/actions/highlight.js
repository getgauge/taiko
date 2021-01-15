const { description } = require('./pageActionChecks');
const { handleRelativeSearch } = require('../proximityElementSearch');
const { findElements } = require('../elementSearch');
const runtimeHandler = require('../handlers/runtimeHandler');

const clearHighlights = async () => {
  await runtimeHandler.runtimeEvaluate(
    `(function () {
          let _class = 'taiko_highlight_style';
          let elems = document.getElementsByClassName(_class);
          Array.from(elems).forEach((e) => e.classList.remove(_class));
          const searchElements = document.querySelectorAll('*');
          for (const element of searchElements) {
            if (element.shadowRoot) {
              let elems = element.shadowRoot.querySelectorAll('.'+_class);
              Array.from(elems).forEach((e) => e.classList.remove(_class));
            }
          }
        })()`,
  );
  return 'Cleared all highlights for this page.';
};

const highlight = async (selector, args) => {
  function highlightNode() {
    function addTaikoHighlightStyleIfNotPresent(self) {
      let taikoHighlightStyleID = 'taiko_highlight';
      const root = self.getRootNode();
      if (root.getElementById(taikoHighlightStyleID)) {
        return;
      }
      let head =
        root instanceof ShadowRoot
          ? root
          : document.head || document.getElementsByTagName('head')[0];
      let style = document.createElement('style');
      let css = '.taiko_highlight_style { outline: 0.5em solid red; }';
      head.appendChild(style);
      style.type = 'text/css';
      style.id = taikoHighlightStyleID;
      style.appendChild(document.createTextNode(css));
    }
    addTaikoHighlightStyleIfNotPresent(this);
    let _class = 'taiko_highlight_style';
    if (this.nodeType === Node.TEXT_NODE) {
      return this.parentElement.classList.add(_class);
    }
    this.classList.add(_class);
  }
  let elems = await handleRelativeSearch(await findElements(selector), args);
  await runtimeHandler.runtimeCallFunctionOn(highlightNode, null, { objectId: elems[0].get() });

  return 'Highlighted the ' + description(elems[0], true);
};

module.exports = { highlight, clearHighlights };
