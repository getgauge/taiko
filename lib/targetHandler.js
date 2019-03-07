let criTarget, eventHandler, default_host, default_port;

const setTarget = async (ctarget, handler, connect_to_cri, currentHost, currentPort) => {
    criTarget = ctarget;
    eventHandler = handler;
    default_host = currentHost;
    default_port = currentPort;
    await criTarget.setDiscoverTargets({ discover: true });
    criTarget.targetCreated(async (target) => {
        if (target.targetInfo.type === 'page') {
            eventHandler.emit('targetCreated');
            //Wait until target url is updated to connect
            while(true){
                if(target.targetInfo.url !== '') break;
                target = await criTarget.getTargetInfo({targetId:target.targetInfo.targetId});
            }
            await connect_to_cri(constructCriTarget(target.targetInfo)).then(()=>eventHandler.emit('targetNavigated'));
        }
    });
};

const constructCriTarget = (target, host = default_host, port = default_port) => {
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
    targetURL = handleUrlRedirection(targetURL);
    for (const target of targets) {
        target.url = handleUrlRedirection(target.url);
        if (target.title === targetURL || target.url.split('://')[1] === (targetURL.split('://')[1] || targetURL)) {
            targetToSwitch = target;
        }
    }
    if (!targetToSwitch) throw new Error('No target with given URL/Title found.');
    return constructCriTarget(targetToSwitch);
};


const getTargetToConnect = async (targetUrl) => {
    const targets = (await criTarget.getTargets()).targetInfos;
    targetUrl = handleUrlRedirection(targetUrl);
    return  targets.find( ( target ) => {
        let _targetUrl = handleUrlRedirection(target.url);
        return target.type === 'page' && (_targetUrl.split('://')[1] !== (targetUrl.split('://')[1] || targetUrl)) && (_targetUrl !== targetUrl);
    });
};

const handleUrlRedirection = (url) => {
    if (url.substr(-1) === '/') {
        url = url.substring(0, url.length - 1);
    }
    if (url.includes('www.')) {
        url = url.replace('www.', '');
    }
    return url;
};

module.exports = { getCriTarget, setTarget, constructCriTarget, getTargetToConnect };