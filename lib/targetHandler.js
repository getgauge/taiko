const targets = new Map();
let criTarget;

const setTarget = async (ctarget,target,connect_to_cri) => {
    criTarget = ctarget;
    if(!targets.has(target.id))targets.set(target.id,target);

    await criTarget.setDiscoverTargets({discover:true});

    criTarget.targetCreated(async (target) => {
        let cri_target = { description: '',
            devtoolsFrontendUrl: '/devtools/inspector.html?ws=127.0.0.1:9222/devtools/page/'+target.targetInfo.targetId,
            id: '1A4C42AB8E25AC00E985ACE981540306',
            title: '',
            type: 'page',
            url: '',
            webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/'+ target.targetInfo.targetId};
        await connect_to_cri(cri_target);
    });

    criTarget.targetInfoChanged((target)=>{
        targets[target.targetInfo.targetID] = target.targetInfo;
    });
};


const getTargets = () => {
    return targets;
};

module.exports = {getTargets,setTarget};