const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const { waitUntil } = require("../../lib/helper");

describe("Helper", () => {
  describe("waitUntil", () => {
    let callCount, maxCallCOunt;
    const condition = async () => {
      if (callCount === maxCallCOunt) {
        return true;
      }
      callCount++;
      return false;
    };
    beforeEach(() => {
      callCount = 0;
      maxCallCOunt = 3;
    });

    it("should retry for given time", async () => {
      await waitUntil(condition, 1, 50);
      expect(callCount).to.be.equal(3);
    });

    it("should fail after given time", async () => {
      maxCallCOunt = 12;
      await expect(waitUntil(condition, 10, 20)).to.be.eventually.rejectedWith(
        "waiting failed: retryTimeout 20ms exceeded",
      );
    });

    it("should fail with actual error if any after given time", async () => {
      await expect(
        waitUntil(
          async () => {
            await condition();
            throw new Error("Actual error message.");
          },
          1,
          50,
        ),
      ).to.be.eventually.rejectedWith("Actual error message.");
      expect(callCount).to.be.equal(3);
    });

    it("should not retry on BrowserProcessCrashed error", async () => {
      await expect(
        waitUntil(
          async () => {
            await condition();
            throw new Error(
              "Browser process with pid 2045 exited with signal SIGTERM",
            );
          },
          1,
          20,
        ),
      ).to.be.eventually.rejectedWith(
        "Browser process with pid 2045 exited with signal SIGTERM",
      );
      expect(callCount).to.be.equal(1);
    });

    it("should not evaluate condition when retryTimeout is not provided", async () => {
      await waitUntil(condition, 1);
      expect(callCount).to.be.equal(0);
    });
  });
});
