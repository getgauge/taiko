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
    if(runtimeResult.result.subtype == 'node') 
        return (await dom.requestNode({ objectId: runtimeResult.result.objectId })).nodeId;
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

const getActiveElementDetails = async (contextId) => {
    function getDetails() {
        return {
            tagName: document.activeElement.tagName, 
            isContentEditable: document.activeElement.isContentEditable,
            disabled: document.activeElement.disabled
        };
    }

    try{
        const result =  await runtime.callFunctionOn({
            functionDeclaration: getDetails.toString(),
            executionContextId: contextId,
            returnByValue: true,
            awaitPromise: true,
            userGesture: true
        });
        return result.result.value;
    }
    catch(e){
        return;
    }
};

const activeElement = async () => {
    let editable,disabled;
    for(const executionContextId of executionContextIds){
        const activeElementDetails = await getActiveElementDetails(executionContextId);
        if(activeElementDetails){
            editable = (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElementDetails.tagName) || (activeElementDetails.isContentEditable));
            disabled = activeElementDetails.disabled;
            if(!(!editable || disabled)) return {notWritable:false,nodeId: await evalCssSelector('document.activeElement',executionContextId)}; 
        }
    }
    return {notWritable: true};
};

module.exports = { setRuntime, findElements, activeElement };

