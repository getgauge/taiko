const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  goto,
  fileField,
  closeBrowser,
  above,
  button,
  attach,
  setConfig,
  $,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const path = require("node:path");
const test_name = "fileField";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
        <form name="upload file">
            <div>
                <input id="file-upload" type="file" name="file">
                </br>
                <input class="button" id="file-submit" type="submit" value="Upload" />
            </div>
            <div>
                <label>
                    <input id="file-upload" type="file" name="file">
                    <span>Select a file</span>
                    <input class="button" id="file-submit" type="submit" value="Upload" />
                </label>
            </div>
            <div>
                <label for="file-upload">Choose a file</label>
                <input id="file-upload" type="file" name="file">
                <input class="button" id="file-submit" type="submit" value="Upload" />
            </div>
            <div>
                <label>Choose a file</label>
                <input id='hidden-file-upload' type='file' style="display:none">
            </div>
            <input type="file" value="similarFileField" id="similarFileField"/>
        </form>`;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 10,
      retryInterval: 10,
    });
  });
  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });
  describe("file field with type text", () => {
    describe("with inline text", () => {
      it("test exists()", async () => {
        expect(await fileField(above(button("Upload"))).exists()).to.be.true;
      });

      it("test value()", async () => {
        await attach(
          path.join(__dirname, "data", "foo.txt"),
          fileField(above(button("Upload"))),
        );
        expect(await fileField(above(button("Upload"))).value()).to.include(
          "foo.txt",
        );
      });

      it("test value() should throw error if the element is not found", async () => {
        expect(fileField("foo").value()).to.be.eventually.rejected;
      });

      it("test description", async () => {
        expect(fileField(above(button("Upload"))).description).to.be.eql(
          "FileField above Button with label Upload ",
        );
      });

      xit("test text()", async () => {
        expect(await fileField(above(button("Upload"))).text()).to.be.eql(
          "File field above Button with label Upload ",
        );
      });

      it("test text should throw if the element is not found", async () => {
        expect(fileField(".foo").text()).to.be.eventually.rejected;
      });
    });
    describe("with wrapped text in label", () => {
      it("test exists()", async () => {
        expect(await fileField("Select a file").exists()).to.be.true;
      });

      it("test value()", async () => {
        await attach(
          path.join(__dirname, "data", "foo.txt"),
          fileField("Select a file"),
        );
        expect(await fileField("Select a file").value()).to.include("foo.txt");
      });

      it("test description", async () => {
        expect(fileField("Select a file").description).to.be.eql(
          "FileField with label Select a file ",
        );
      });

      xit("test text()", async () => {
        expect(await fileField("Select a file").text()).to.be.eql(
          "File field with label Select a file ",
        );
      });
    });
    describe("using label for", () => {
      it("test exists()", async () => {
        expect(await fileField("Choose a file").exists()).to.be.true;
      });

      it("test value()", async () => {
        await attach(
          path.join(__dirname, "data", "foo.txt"),
          fileField("Select a file"),
        );
        expect(await fileField("Choose a file").value()).to.include("foo.txt");
      });

      it("test description", async () => {
        expect(fileField("Choose a file").description).to.be.eql(
          "FileField with label Choose a file ",
        );
      });

      xit("test text()", async () => {
        expect(await fileField("Choose a file").text()).to.be.eql(
          "File field with label Choose a file ",
        );
      });
    });
  });
  describe("hidden", () => {
    it("hidden element exists", async () => {
      expect(await fileField({ id: "hidden-file-upload" }).exists()).to.be.true;
    });
    it("attach to hidden element", async () => {
      await attach(
        path.join(__dirname, "data", "foo.txt"),
        fileField({ id: "hidden-file-upload" }),
        { force: true },
      );
      expect(await fileField({ id: "hidden-file-upload" }).value()).to.include(
        "foo.txt",
      );
    });
  });

  describe("test elementList properties", () => {
    it("test get of elements", async () => {
      const elements = await fileField({
        id: "similarFileField",
      }).elements();
      expect(elements[0].get()).to.be.a("string");
    });

    it("test description of elements", async () => {
      const elements = await fileField({
        id: "similarFileField",
      }).elements();
      expect(elements[0].description).to.be.eql(
        'FileField[id="similarFileField"]',
      );
    });

    it("test value of elements", async () => {
      const elements = await fileField({
        id: "similarFileField",
      }).elements();
      await attach(path.join(__dirname, "data", "foo.txt"), elements[0]);
      expect(await elements[0].value()).to.include("foo.txt");
    });

    xit("test text of elements", async () => {
      const elements = await fileField({
        id: "similarFileField",
      }).elements();
      expect(await elements[0].text()).to.be.eql("similarFileField");
    });
  });

  describe("using a file that does not exists", () => {
    it("throws a error when the file does not exist", async () => {
      await expect(
        attach(
          path.join(__dirname, "data", "foowrong.txt"),
          fileField("Select a file"),
        ),
      ).to.be.rejectedWith(
        `File ${path.join(__dirname, "data", "foowrong.txt")} does not exist.`,
      );
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => fileField($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `fileField` selector. Refer https://docs.taiko.dev/api/filefield/ for the correct parameters",
      );
    });
  });
});

describe("Multiple file upload", () => {
  let filePath;
  beforeEach(async () => {
    const innerHtml = `
  <!doctype html>
    <html>
    <head>
    <title>Proper Title</title>
    </head>
        
    <body>
    
    <form id="myForm" method="post" enctype="multipart/form-data">
    
            Files: <input type="file" id="files" name="files" multiple><br/>
    
            <div id="selectedFiles"></div>
    
            <input type="submit">
    </form>
    
    <script>
    var selDiv = "";
    
    document.addEventListener("DOMContentLoaded", init, false);
    function init() {
        document.querySelector('#files').addEventListener('change', handleFileSelect, false);
    selDiv = document.querySelector("#selectedFiles");
    }
    
    function handleFileSelect(e) {
    if(!e.target.files) return;
    selDiv.innerHTML = "";
    
    var files = e.target.files;
    for(var i=0; i<files.length; i++) {
    var f = files[i];
    selDiv.innerHTML += f.name + "<br/>";
    }
    }
    </script>
    </body>
    </html>
      `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 10,
      retryInterval: 10,
    });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  it("test multiple file can be uploaded", async () => {
    await attach(
      [
        path.join(__dirname, "data", "foo.txt"),
        path.join(__dirname, "data", "doo.txt"),
      ],
      await fileField({
        id: "files",
      }),
    );
    expect(await $("#selectedFiles").text()).to.equal("foo.txt\ndoo.txt\n");
  });
});
