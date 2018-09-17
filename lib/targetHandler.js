const {waitFor} = require('./helper');
let criTarget, eventHandler, default_host, default_port;

const setTarget = async (ctarget, handler, connect_to_cri, currentHost, currentPort) => {
    criTarget = ctarget;
    eventHandler = handler;
    default_host = currentHost;
    default_port = currentPort;
    await criTarget.setDiscoverTargets({discover:true});
    criTarget.targetCreated(async (target) => {
        if(target.targetInfo.type === 'page'){ 
            eventHandler.emit('targetCreated');
            await connect_to_cri(constructCriTarget(target.targetInfo));
            await Promise.race([waitFor(15000), new Promise((resolve) => {
                eventHandler.addListener('loadEventFired', resolve);
            })]).then(eventHandler.emit('targetNavigated'));
        }    
    });
};

const constructCriTarget = (target,host=default_host,port=default_port) => {
    return { 
        description: '',
        devtoolsFrontendUrl: `/devtools/inspector.html?ws=${host}:${port}/devtools/page/${target.targetId}`,
        id: target.targetId,
        title: '',
        type: 'page',
        url: '',
        webSocketDebuggerUrl: `ws://${host}:${port}/devtools/page/${target.targetId}`
    };
};

const getCriTarget = async (targetURL) => {
    let targetToSwitch;
    const targets = (await criTarget.getTargets()).targetInfos; 
    for(const target of targets){
        if(target.title === targetURL || target.url === targetURL) targetToSwitch = target;
    }
    if(!targetToSwitch) throw new Error('No target with given URL/Title found.');
    return constructCriTarget(targetToSwitch);
};


const getTargetToConnect = async (targetUrl) => {
    const targets = (await criTarget.getTargets()).targetInfos;
    let targetToConnect;
    for(const target of targets){
        if (target.type === 'page' && target.url !== targetUrl){
            targetToConnect = target;
        }
    }
    return targetToConnect;
};

module.exports = {getCriTarget,setTarget, constructCriTarget, getTargetToConnect};