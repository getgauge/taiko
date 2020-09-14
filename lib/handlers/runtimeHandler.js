const { eventHandler } = require('../eventBus');
const { isString } = require('../helper');
let executionContextIds = [];
let runtime;

eventHandler.on('createdSession', async (client) => {
  let resolve;
  eventHandler.emit(
    'handlerActingOnNewSession',
    new Promise((r) => {
      resolve = r;
    }),
  );
  executionContextIds = [];
  runtime = client.Runtime;
  runtime.executionContextCreated((event) => {
    executionContextIds.push(event.context.id);
  });
  runtime.executionContextDestroyed((id) => {
    executionContextIds = executionContextIds.filter((e) => e !== id);
  });
  runtime.executionContextsCleared(() => {
    executionContextIds = [];
  });
  await runtime.enable();
  resolve();
});

const getObjectIdsFromResult = async (runtimeResult) => {
  if (
    !runtimeResult ||
    (runtimeResult.result && runtimeResult.result.type === 'undefined') ||
    runtimeResult.exceptionDetails
  ) {
    return [];
  }
  if (runtimeResult.result.subtype == 'node') {
    return runtimeResult.result.objectId;
  }
  let objectIds = [];
  try {
    const { result } = await runtime.getProperties(runtimeResult.result);
    for (const r of result) {
      if (isNaN(r.name)) {
        break;
      }
      objectIds.push(r.value.objectId);
    }
  } catch (e) {
    if (e && e.message && e.message.includes('Cannot find context with specified id')) {
      return objectIds;
    } else {
      throw e;
    }
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
    if (e && e.message.includes('Cannot find context with specified id')) {
      if (executionContextId) {
        executionContextIds = executionContextIds.filter((id) => id !== executionContextId);
      }
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
    if (e && e.message && e.message.includes('Cannot find context with specified id')) {
      if (executionContextId) {
        executionContextIds = executionContextIds.filter((id) => id !== executionContextId);
      }
    } else {
      throw e;
    }
  }
  if (
    (runtimeResult &&
      runtimeResult.result &&
      runtimeResult.result.subtype === 'error' &&
      runtimeResult.result.description.includes(
        'TypeError: window[arg.funcName] is not a function',
      )) ||
    (runtimeResult &&
      runtimeResult.exceptionDetails &&
      runtimeResult.exceptionDetails.text.includes(
        'window[("taiko_" + (intermediate value))] is not a function',
      ))
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
    let objectIdsFromRes = await getObjectIdsFromResult(
      await evalFunc(exp, contextId, { arg: arg }),
    );
    objectIds = objectIds.concat(objectIdsFromRes);
  }
  return objectIds;
};

const activeElement = async () => {
  function getActiveElement() {
    let activeElement = document.activeElement;
    const parsedShadowRoots = [];
    while (activeElement.shadowRoot && !parsedShadowRoots.includes(activeElement.shadowRoot)) {
      parsedShadowRoots.push(activeElement.shadowRoot);
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  }

  function getDetails() {
    return {
      tagName: this.tagName,
      isContentEditable: this.isContentEditable,
      disabled: this.disabled,
      type: this.type,
      readOnly: this.readOnly,
    };
  }

  let editable, disabled;

  const activeElementObjectIds = await findElements(getActiveElement);
  for (let activeElementObjectId of activeElementObjectIds) {
    const result = await runtimeCallFunctionOn(getDetails, null, {
      objectId: activeElementObjectId,
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
          objectId: activeElementObjectId,
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
  runtimeEvaluate,
  runtimeCallFunctionOn,
};
