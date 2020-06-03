const { eventHandler } = require('../eventBus');
const { isString } = require('../helper');
let executionContextIds = [];
let runtime;

eventHandler.on('createdSession', (client) => {
  executionContextIds = [];
  runtime = client.Runtime;
  runtime.executionContextCreated((event) => {
    executionContextIds.push(event.context.id);
  });
  runtime.executionContextDestroyed((id) => {
    executionContextIds = executionContextIds.filter((e) => e !== id);
  });
  runtime.enable();
});

const getobjectIdsFromResult = async (runtimeResult) => {
  if (!runtimeResult) {
    return [];
  }
  if (runtimeResult.result.subtype == 'node') {
    return runtimeResult.result.objectId;
  }
  let objectIds = [];
  const { result } = await runtime.getProperties(runtimeResult.result);
  for (const r of result) {
    if (isNaN(r.name)) {
      break;
    }
    objectIds.push(r.value.objectId);
  }
  return objectIds;
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
    if (e.response.message === 'Cannot find context with specified id' && executionContextId) {
      executionContextIds = executionContextIds.filter((id) => id !== executionContextId);
    } else {
      throw e;
    }
  }
  return runtimeResult;
};

const runtimeCallFunctionOn = async (exp, executionContextId, opt = {}) => {
  let runtimeResult;
  function expWindowWrapper(arg) {
    return window[`taiko_${arg.funcName}`](arg.arg);
  }
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
  if (opt.objectId !== null && opt.objectId !== undefined) {
    options['objectId'] = opt.objectId;
  }
  if (executionContextId !== null && executionContextId !== undefined) {
    options['executionContextId'] = executionContextId;
    options['functionDeclaration'] = expWindowWrapper.toString();
    options['arguments'] = [{ value: { arg: opt.arg, funcName: exp.name } }];
  }
  try {
    runtimeResult = await runtime.callFunctionOn(options);
  } catch (e) {
    if (
      e.response &&
      e.response.message === 'Cannot find context with specified id' &&
      executionContextId
    ) {
      executionContextIds = executionContextIds.filter((id) => id !== executionContextId);
    } else {
      throw e;
    }
  }
  if (
    runtimeResult &&
    runtimeResult.result.subtype === 'error' &&
    runtimeResult.result.description.includes('TypeError: window[arg.funcName] is not a function')
  ) {
    await runtimeEvaluate(`window['taiko_${exp.name}'] = ${exp}`, executionContextId);
    runtimeResult = await runtime.callFunctionOn(options);
  }
  return runtimeResult;
};

const findElements = async (exp, arg) => {
  let objectIds = [];
  const evalFunc = isString(exp) ? runtimeEvaluate : runtimeCallFunctionOn;
  for (const contextId of executionContextIds) {
    let objectIdsFromRes = await getobjectIdsFromResult(await evalFunc(exp, contextId, { arg: arg }));
    objectIds = objectIds.concat(objectIdsFromRes);
    objectIds = objectIds.filter(function (item, pos) {
      return objectIds.indexOf(item) == pos;
    });
  }
  return objectIds;
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
          objectId: await getobjectIdsFromResult(
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
  getobjectIdsFromResult,
  runtimeEvaluate,
  runtimeCallFunctionOn,
};
