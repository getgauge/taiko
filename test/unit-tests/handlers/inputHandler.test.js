const rewire = require('rewire');
const expect = require('chai').expect;
const inputHandler = rewire('../../../lib/inputHandler');

describe.only('inputHandler', () => {
    let calledWith = [];

    beforeEach(() => {
        calledWith = [];
        inputHandler.setInput({
            dispatchKeyEvent: async (param) => {
                calledWith.push(param);
            },
            dispatchMouseEvent: async (param) => {
                calledWith.push(param);
            },
            dispatchTouchEvent: async (param) => {
                calledWith.push(param);
            }
        });
    });

    it('.setinput should set the browser as global var', () => {
        inputHandler.setInput(new Object('Input Instance'));
        let em = inputHandler.__get__('input');
        expect(em).to.instanceof(Object);
        expect(em.toString()).to.eq('Input Instance');
    });

    it('.up should dispach keyUp event', async () => {
        await inputHandler.up('a');
        expect(calledWith[0].code).to.be.eql('KeyA');
        expect(calledWith[0].type).to.be.eql('keyUp');
    });

    it('.down should dispach keyDown event', async () => {
        await inputHandler.down('b');
        expect(calledWith[0].code).to.be.eql('KeyB');
        expect(calledWith[0].type).to.be.eql('keyDown');
    });

    it('.mouse_move should dispach mouseMoved event', async () => {
        await inputHandler.mouse_move({ x: 0, y: 0 }, { x: 5, y: 5 });
        expect(calledWith[0].type).to.be.eql('mouseMoved');
    });

    it('.tap should dispach touchStart and touchEnd event', async () => {
        await inputHandler.tap(0,0);
        expect(calledWith[0].type).to.be.eql('touchStart');
        expect(calledWith[1].type).to.be.eql('touchEnd');
    });

});
