const cri = require('chrome-remote-interface');
const { waitUntil, handleUrlRedirection } = require('./helper');

const intervalTime = 10, timeout = 30000;

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
            await waitUntil(async () => (await criTarget.getTargetInfo({ targetId: target.targetInfo.targetId })).targetInfo.url !== '', intervalTime, timeout);
            await connect_to_cri(constructCriTarget(target.targetInfo)).then(() => eventHandler.emit('targetNavigated'));
        }
    });
};

const constructCriTarget = (target, host = default_host, port = default_port) => {
    let id = target.targetId || target.id;
    return {
        description: '',
        devtoolsFrontendUrl: `/devtools/inspector.html?ws=${host}:${port}/devtools/page/${id}`,
        id: id,
        title: '',
        type: 'page',
        url: '',
        webSocketDebuggerUrl: `ws://${host}:${port}/devtools/page/${id}`
    };
};

const getCriTargets = async function (targetUrl) {
    let targets = await cri.List({ host: default_host, port: default_port });
    let pages = targets.filter(target => target.type === 'page');
    let response = { matching: pages.slice(0, 1), others: pages.slice(1) };
    if (targetUrl) {
        response = { matching: [], others: [] };
        for (const target of targets) {
            target.url = handleUrlRedirection(target.url);
            if (target.title === targetUrl || target.url.split('://')[1] === (targetUrl.split('://')[1] || targetUrl) || target.url.split('://')[1] === (targetUrl.split('://www.')[1] || targetUrl)) {
                response.matching.push(target);
            } else {
                response.others.push(target);
            }
        }
    }
    return response;
};

module.exports = { setTarget, constructCriTarget, getCriTargets };