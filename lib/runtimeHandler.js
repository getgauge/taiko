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
    if(!runtimeResult) return [];
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

const runtimeEvaluate = async (exp,executionContextId,opt = {}) => {
    let runtimeResult;
    let returnByValue = opt.returnByValue || false;
    let options = {
        expression: exp,
        returnByValue: returnByValue,
        awaitPromise: true,
        userGesture: true
    };
    if(executionContextId !== null && executionContextId !== undefined) options['contextId'] = executionContextId;
    try{
        runtimeResult = await runtime.evaluate(options);
    }catch(e){
        return;
    }
    return runtimeResult;
};

const runtimeCallFunctionOn = async (exp,executionContextId,opt = {}) => {
    let runtimeResult; 
    let returnByValue = opt.returnByValue || false;
    try{
        runtimeResult = await runtime.callFunctionOn({
            functionDeclaration: exp.toString(),
            executionContextId: executionContextId,
            arguments: [{ value: opt.arg }],
            returnByValue: returnByValue,
            awaitPromise: true,
            userGesture: true
        });
    }catch(e){
        return;
    }
    return runtimeResult;
};

const findElements = async (exp,arg) => {
    let nodeIds = [];
    const evalFunc = isString(exp) ? runtimeEvaluate : runtimeCallFunctionOn ;
    for (const contextId of executionContextIds) {
        nodeIds = await getNodeIdsFromResult(await evalFunc(exp,contextId,{arg:arg}));
        if (nodeIds.length) break;
    }
    return nodeIds;
};


const activeElement = async () => {
    function getDetails() {
        return {
            tagName: document.activeElement.tagName, 
            isContentEditable: document.activeElement.isContentEditable,
            disabled: document.activeElement.disabled,
            type: document.activeElement.type
        };
    }

    let editable,disabled;
    for(const executionContextId of executionContextIds){
        const result = await runtimeCallFunctionOn(getDetails, executionContextId, {returnByValue:true});
        const activeElementDetails = (result) ? result.result.value : undefined;
        if(activeElementDetails){
            editable = (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElementDetails.tagName) || (activeElementDetails.isContentEditable));
            disabled = activeElementDetails.disabled;
            if(!(!editable || disabled)) return {notWritable:false,nodeId: await getNodeIdsFromResult(await runtimeEvaluate('document.activeElement',executionContextId)),isPassword:activeElementDetails.type === 'password'}; 
        }
    }
    return {notWritable: true};
};

module.exports = { setRuntime, findElements, activeElement, getNodeIdsFromResult, runtimeEvaluate, runtimeCallFunctionOn };

