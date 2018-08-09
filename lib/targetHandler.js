const targets = new Map();
let criTarget;

const setTarget = (target,connect_to_cri) => {
    criTarget = target;
    if(!targets.has(target.id))targets.set(target.id,target);
    criTarget.targetCreated(async (target) => {
        await connect_to_cri(target);
    });
    criTarget.targetInfoChanged((target)=>{
        targets[target.targetInfo.targetID] = target.targetInfo;
    });
};


const getTargets = () => {
    return targets;
};

module.exports = {getTargets,setTarget};