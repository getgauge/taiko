const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const rewire = require("rewire");
chai.use(chaiAsPromised);
const expect = chai.expect;
const test_name = "cookies";

describe(test_name, () => {
  let taiko;
  before(() => {
    taiko = rewire("../../lib/taiko");
    taiko.__set__("validate", () => {});
  });

  after(() => {
    taiko = rewire("../../lib/taiko");
  });

  it("setCookie should throw error if url or domain is not specified", async () => {
    await expect(
      taiko.setCookie("someCookie", "foo"),
    ).to.eventually.be.rejectedWith(
      "At least URL or domain needs to be specified for setting cookies",
    );
  });

  it("setCookie should throw error if cookie is not set", async () => {
    taiko.__set__("networkHandler", {
      setCookie: async () => {
        return Promise.resolve({ success: false });
      },
    });
    const cookieName = "MySetCookie";
    await expect(
      taiko.setCookie(cookieName, "Foo", { url: "file:///foo.html" }),
    ).to.eventually.be.rejectedWith(`Unable to set ${cookieName} cookie`);
  });

  it("setCookie should set successfully", async () => {
    taiko.__set__("networkHandler", {
      setCookie: async () => {
        return Promise.resolve({ success: true });
      },
    });
    const cookieName = "MySetCookie";
    await expect(
      taiko.setCookie(cookieName, "Foo", { url: "file:///foo.html" }),
    ).not.to.eventually.be.rejected;
  });

  it("deleteCookie should delete all cookies if no cookie name is given", async () => {
    taiko.__set__("networkHandler", {
      clearBrowserCookies: async () => {
        return Promise.resolve();
      },
    });
    await expect(taiko.deleteCookies(" ")).not.to.eventually.be.rejected;
  });

  it("deleteCookie should throw error if domian or url is not specified along with cookie name", async () => {
    taiko.__set__("networkHandler", {
      deleteCookies: async () => {
        return Promise.resolve();
      },
    });
    await expect(taiko.deleteCookies("MyCookie")).to.eventually.be.rejectedWith(
      "At least URL or domain needs to be specified for deleting cookies",
    );
  });
});
