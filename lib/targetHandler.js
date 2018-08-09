const targets = new Map();
let criTarget;

const setTarget = async (ctarget,target,connect_to_cri) => {
    criTarget = ctarget;
    if(!targets.has(target.id))targets.set(target.id,target);

    await criTarget.setDiscoverTargets({discover:true});

    criTarget.targetCreated(async (target) => {
        await connect_to_cri(constructCriTarget(target.targetInfo));
    });

    criTarget.targetInfoChanged((target)=>{
        targets.set(target.targetInfo.targetId, target.targetInfo);
    });
};

const constructCriTarget = (target) => {
    return { 
        description: '',
        devtoolsFrontendUrl: '/devtools/inspector.html?ws=127.0.0.1:9222/devtools/page/'+target.targetId,
        id: target.targetId,
        title: '',
        type: 'page',
        url: '',
        webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/'+ target.targetId
    };
};

const getUrlList = () => {
    let urlList = '';
    let count = 0;
    targets.forEach((value)=>{
        count ++;
        urlList += `\n${count}: ${value.url}`;
    });
    return urlList;
};

const getCriTarget = (targetURL) => {
    let target;
    targets.forEach((value,key) => {
        if(value.url === targetURL) target = targets.get(key);
    });
    if(!target) throw new Error('No target with given URL found.\nURL list' + getUrlList());
    return constructCriTarget(target);
};

module.exports = {getCriTarget,setTarget};