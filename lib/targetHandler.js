const targets = new Map();
const default_host = '127.0.0.1';
const default_port = '9222';
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

const getUrlList = () => {
    let urlList = '';
    let count = 0;
    targets.forEach((value)=>{
        count ++;
        urlList += `\n${count}: ${value.title}`;
    });
    return urlList;
};

const getCriTarget = (targetURL) => {
    let target;
    targets.forEach((value,key) => {
        if(value.title === targetURL) target = targets.get(key);
    });
    if(!target) throw new Error('No target with given URL found.\nURL list' + getUrlList());
    return constructCriTarget(target);
};

module.exports = {getCriTarget,setTarget};