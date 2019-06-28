exports.filterVisibleNodes = async (nodeIds, callFunctionOn) => {
    let visibleNodes = [];
    function isHidden() {
        let elem = this;
        // elem is a DOM node whose node id we have passed to the function `callFunctionOn`
        if (elem.nodeType === Node.TEXT_NODE)
            elem = elem.parentElement;
        return !(elem.offsetHeight || elem.offsetWidth || elem.getClientRects().length);
    }
    for (const nodeId of nodeIds) {
        const result = await callFunctionOn(nodeId, isHidden);
        if (!result.value)
            visibleNodes.push(nodeId);
    }
    return visibleNodes;
};