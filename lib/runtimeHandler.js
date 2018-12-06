const {isString} = require('./helper.js');
const executionContextIds = [];
let runtime,dom;

const setRuntime = (r,d) => {
    runtime = r;
    dom = d;
    runtime.executionContextCreated(event => {
        executionContextIds.push(event.context.id);
    });
};

const getNodeIdsFromResult = async (runtimeResult) => {
    let nodeIds = [];
    const { result } = await runtime.getProperties(runtimeResult.result);
    for (const r of result) {
        if (isNaN(r.name)) break;
        nodeIds.push((await dom.requestNode({ objectId: r.value.objectId })).nodeId);
    }
    return nodeIds;
};

const evalCssSelector = async (exp,executionContextId) => {
    let runtimeResult;
    try{
        runtimeResult = await runtime.evaluate({
            expression: exp,
            contextId: executionContextId,
            returnByValue: false,
            awaitPromise: true,
            userGesture: true
        });
    }catch(e){
        return [];
    }
    return getNodeIdsFromResult(runtimeResult);
};

const evalXpath = async (exp,executionContextId,arg) => {
    let runtimeResult; 
    try{
        runtimeResult = await runtime.callFunctionOn({
            functionDeclaration: exp.toString(),
            executionContextId: executionContextId,
            arguments: [{ value: arg }],
            returnByValue: false,
            awaitPromise: true,
            userGesture: true
        });
    }catch(e){
        return [];
    }
    return getNodeIdsFromResult(runtimeResult);
};

const findElements = async (exp,arg) => {
    let nodeIds = [];
    const evalFunc = isString(exp) ? evalCssSelector : evalXpath ;
    for (const contextId of executionContextIds) {
        nodeIds = await evalFunc(exp,contextId,arg);
        if (nodeIds.length) break;
    }
    return nodeIds;
};

module.exports = { setRuntime, findElements };

