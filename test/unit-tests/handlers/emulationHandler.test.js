const rewire = require('rewire');
const expect = require('chai').expect;
const assert = require('chai').assert;
const emulationHandler = rewire('../../../lib/handlers/emulationHandler');

describe('emulationHandler', () => {
    let calledWith = {};

    beforeEach(() => {
        calledWith = {};
        emulationHandler.setEmulation({
            setGeolocationOverride: async (param) => {
                calledWith = param;
            },
            setDeviceMetricsOverride: async (param) => {
                calledWith = param;
            }
        });
    });

    it('.setEmulation should set the emulation as global var', () => {
        emulationHandler.setEmulation(new Object('Emulation Instance'));
        let em = emulationHandler.__get__('emulation');
        expect(em).to.instanceof(Object);
        expect(em.toString()).to.eq('Emulation Instance');
    });

    it('.setLocation should set the location', async () => {
        await emulationHandler.setLocation({ longitude: 123, latitude: 54 });
        expect(calledWith).to.be.eql({ longitude: 123, latitude: 54, accuracy: 0 });
    });

    it('.setLocation should fail for invalid location', async () => {
        try {
            await emulationHandler.setLocation({ longitude: 1234, latitude: 54 });
            assert.fail('should throw error here');
        } catch (error) {
            expect(error.message).to.be.eql('Invalid longitude "1234": precondition -180 <= LONGITUDE <= 180 failed.');
        }

        try {
            await emulationHandler.setLocation({ longitude: 123, latitude: 543 });
            assert.fail('should throw error here');
        } catch (error) {
            expect(error.message).to.be.eql('Invalid latitude "543": precondition -90 <= LATITUDE <= 90 failed.');
        }

        try {
            await emulationHandler.setLocation({ longitude: 123, latitude: 543 });
            assert.fail('should throw error here');
        } catch (error) {
            expect(error.message).to.be.eql('Invalid latitude "543": precondition -90 <= LATITUDE <= 90 failed.');
        }
    });
    it('.setViewport should throw error if height or width not given', async () => {
        try {
            await emulationHandler.setViewport({});
        } catch (error) {
            expect(error.message).to.be.eql('No height and width provided');
        }
    });

    it('.setViewport should set viewport and use default setting if not provided', async () => {
        await emulationHandler.setViewport({ height: 123, width: 543 });
        expect(calledWith).to.be.eql({ height: 123, width: 543, mobile: false, screenOrientation: { angle: 0, type: 'portraitPrimary' }, deviceScaleFactor: 1 });
    });

});
