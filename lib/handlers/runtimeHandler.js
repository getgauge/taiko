const { eventHandler } = require('../eventBus');
const { isString } = require('../helper');
let executionContextIds = [];
let runtime, dom;

eventHandler.on('createdSession', client => {
  runtime = client.Runtime;
  dom = client.DOM;
  runtime.executionContextCreated(event => {
    executionContextIds.push(event.context.id);
  });
  runtime.executionContextDestroyed(id => {
    executionContextIds = executionContextIds.filter(e => e !== id);
  });
  runtime.enable();
});

const getNodeIdsFromResult = async runtimeResult => {
  if (!runtimeResult) {
    return [];
  }
  if (runtimeResult.result.subtype == 'node') {
    return (
      await dom.requestNode({
        objectId: runtimeResult.result.objectId,
      })
    ).nodeId;
  }
  let nodeIds = [];
  const { result } = await runtime.getProperties(runtimeResult.result);
  for (const r of result) {
    if (isNaN(r.name)) {
      break;
    }
    nodeIds.push((await dom.requestNode({ objectId: r.value.objectId })).nodeId);
  }
  return nodeIds;
};

const runtimeEvaluate = async (exp, executionContextId, opt = {}) => {
  let runtimeResult;
  let options = {
    expression: exp,
    awaitPromise: true,
    userGesture: true,
  };
  if (opt.returnByValue) {
    options['returnByValue'] = opt.returnByValue;
  }
  if (executionContextId !== null && executionContextId !== undefined) {
    options['contextId'] = executionContextId;
  }
  try {
    runtimeResult = await runtime.evaluate(options);
  } catch (e) {
    if (e.message.match(/Chrome process with pid \d+ exited with/)) {
      throw e;
    }
    if (e.response.message === 'Cannot find context with specified id' && executionContextId) {
      executionContextIds = executionContextIds.filter(id => id !== executionContextId);
    }
  }
  return runtimeResult;
};

const runtimeCallFunctionOn = async (exp, executionContextId, opt = {}) => {
  let runtimeResult;
  let options = {
    functionDeclaration: exp.toString(),
    awaitPromise: true,
    userGesture: true,
  };
  if (opt.returnByValue) {
    options['returnByValue'] = opt.returnByValue;
  }
  if (opt.arg !== null && opt.arg !== undefined) {
    options['arguments'] = [{ value: opt.arg }];
  }
  if (opt.nodeId !== null && opt.nodeId !== undefined) {
    const {
      object: { objectId },
    } = await dom.resolveNode({ nodeId: opt.nodeId });
    options['objectId'] = objectId;
  }
  if (executionContextId !== null && executionContextId !== undefined) {
    options['executionContextId'] = executionContextId;
  }
  try {
    runtimeResult = await runtime.callFunctionOn(options);
  } catch (e) {
    if (e.message.match(/Chrome process with pid \d+ exited with/)) {
      throw e;
    }
    if (
      e.response &&
      e.response.message === 'Cannot find context with specified id' &&
      executionContextId
    ) {
      executionContextIds = executionContextIds.filter(id => id !== executionContextId);
    }
  }
  return runtimeResult;
};

const findElements = async (exp, arg) => {
  let nodeIds = [];
  const evalFunc = isString(exp) ? runtimeEvaluate : runtimeCallFunctionOn;
  for (const contextId of executionContextIds) {
    let nodeIdsFromRes = await getNodeIdsFromResult(await evalFunc(exp, contextId, { arg: arg }));
    nodeIds = nodeIds.concat(nodeIdsFromRes);
    nodeIds = nodeIds.filter(function(item, pos) {
      return nodeIds.indexOf(item) == pos;
    });
  }
  return nodeIds;
};

const activeElement = async () => {
  function getDetails() {
    return {
      tagName: document.activeElement.tagName,
      isContentEditable: document.activeElement.isContentEditable,
      disabled: document.activeElement.disabled,
      type: document.activeElement.type,
      readOnly: document.activeElement.readOnly,
    };
  }

  let editable, disabled;
  for (const executionContextId of executionContextIds) {
    const result = await runtimeCallFunctionOn(getDetails, executionContextId, {
      returnByValue: true,
    });
    const activeElementDetails = result ? result.result.value : undefined;
    if (activeElementDetails) {
      editable =
        !activeElementDetails.readOnly &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElementDetails.tagName) ||
          activeElementDetails.isContentEditable);
      disabled = activeElementDetails.disabled;
      if (!(!editable || disabled)) {
        return {
          notWritable: false,
          nodeId: await getNodeIdsFromResult(
            await runtimeEvaluate('document.activeElement', executionContextId),
          ),
          isPassword: activeElementDetails.type === 'password',
        };
      }
    }
  }
  return { notWritable: true };
};

module.exports = {
  findElements,
  activeElement,
  getNodeIdsFromResult,
  runtimeEvaluate,
  runtimeCallFunctionOn,
};
