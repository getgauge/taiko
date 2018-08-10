const default_host = '127.0.0.1';
const default_port = '9222';
let criTarget;

const setTarget = async (ctarget,connect_to_cri) => {
    criTarget = ctarget;
    await criTarget.setDiscoverTargets({discover:true});
    criTarget.targetCreated(async (target) => {
        await connect_to_cri(constructCriTarget(target.targetInfo));
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

module.exports = {getCriTarget,setTarget};