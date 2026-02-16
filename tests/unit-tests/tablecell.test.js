const {
  openBrowser,
  goto,
  below,
  tableCell,
  closeBrowser,
  setConfig,
  text,
  above,
  link,
  near,
  $,
} = require("taiko");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const { createHtml, removeFile, openBrowserArgs } = require("./test-util");
const test_name = "tableCell";

describe(test_name, () => {
  let filePath;

  before(async () => {
    const innerHtml = `
      <article id="text__hr">
      <header><h1>Horizontal rules</h1></header>
      <div>
        <hr>
      </div>
      <footer><p><a href="#top">[Top]</a></p></footer>
    </article>
    <article id="text__tables">
            <header><h1>Tabular data</h1></header>
            <table>
              <caption><strong>Table Caption</strong></caption>
              <thead>
                <tr>
                  <th>Table Heading 1</th>
                  <th>Table Heading 2</th>
                  <th>Table Heading 3</th>
                  <th>Table Heading 4</th>
                  <th>Table Heading 5</th>
                </tr>
              </thead>
              <tfoot>
                <tr>
                  <td>Table Footer 1</td>
                  <td>Table Footer 2</td>
                  <td>Table Footer 3</td>
                  <td>Table Footer 4</td>
                  <td>Table Footer 5</td>
                </tr>
              </tfoot>
              <tbody>
                <tr>
                  <td>Table Cell 1.1</td>
                  <td>Table Cell 1.2</td>
                  <td>Table Cell 1.3</td>
                  <td id='lucky'>Table Cell 1.4</td>
                  <td>Table Cell 1.5</td>
                </tr>
                <tr>
                  <td>Table Cell 2.1</td>
                  <td>Table Cell 2.2</td>
                  <td>Table Cell 2.3</td>
                  <td>Table Cell 2.4</td>
                  <td>Table Cell 2.5</td>
                </tr>
                <tr>
                  <td>Table Cell 3.1</td>
                  <td>Table Cell 3.2</td>
                  <td>Table Cell 3.3</td>
                  <td>Table Cell 3.4</td>
                  <td>Table Cell 3.5</td>
                </tr>
                <tr>
                  <td>Table Cell 4.1</td>
                  <td>Table Cell 4.2</td>
                  <td>Table Cell 4.3</td>
                  <td>Table Cell 4.4</td>
                  <td>Table Cell 4.5</td>
                </tr>
              </tbody>
            </table>
            <footer><p><a href="#top">[Top]</a></p></footer>
          </article>
          <div>
            <table border = "1" cellspacing="1" bordercolor="blue" bgcolor="yellow">
              <tr>
                <th colspan="8">TIME TABLE</th>
              </tr>
    
              <tr>
                <th>DAYS</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th rowspan="7">lunch break</th>
                <th>4</th>
                <th>5</th>
                <th>6</th>
              </tr>
              <tr>
                  <td>MONDAY</td>
                  <td>Accounts</td>
                  <td>English</td>
                  <td>Statistics</td>
                  <td>Banking</td>
                  <td align="center">-</td>
                  <td align="center">EP</td>
              </tr>
              <tr>
                  <td>TUESDAY</td>
                  <td>Statistics</td>
                  <td>Banking</td>
                  <td>English</td>
                  <td>Accounts</td>
                  <td align="center">-</td>
                  <td align="center">-</td>
              </tr>
              <tr>
                  <td>WEDNESDAY</td>
                  <td>English</td>
                  <td>Statistics</td>
                  <td>Accounts</td>
                  <td align="center">EP</td>
                  <td>Banking</td>
                  <td align="center">-</td>
              </tr>
              <tr>
                  <td>THURSDAY</td>
                  <td align="center">-</td>
                  <td align="center">CA</td>
                  <td>Statistics</td>
                  <td>English</td>
                  <td align="center">EP</td>
                  <td align="center">-</td>
              </tr>
              <tr>
                  <td>FRIDAY</td>
                  <td>Banking</td>
                  <td>Statistics</td>
                  <td>English</td>
                  <td colspan="2" align="center">ICT</td>
                  <td align="center">CA</td>
              </tr>
              <tr>
                  <td>SATURSDAY</td>
                  <td>Banking</td>
                  <td align="center">CA</td>
                  <td>Statistics</td>
                  <td colspan="2" align="center">English</td>
                  <td>Accounts</td>
              </tr>
            </table>
          </div>
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
    setConfig({
      waitForNavigation: true,
    });
    await closeBrowser();
    removeFile(filePath);
  });

  describe("using no label/caption", () => {
    it("test tableCell exists()", async () => {
      expect(
        await tableCell({
          row: 1,
          col: 1,
        }).exists(),
      ).to.be.true;
    });

    it("test tableCell description", async () => {
      expect(
        await tableCell({
          row: 1,
          col: 1,
        }).description,
      ).to.be.eql("Table with tableCell at row:1 and column:1");
    });

    it("test tableCell text()", async () => {
      expect(
        await tableCell({
          row: 1,
          col: 1,
        }).text(),
      ).to.be.oneOf(["Table Cell 1.1", "MONDAY"]); // there are two tables
    });

    it("test tableCell throw error if row and col not provided", async () => {
      await expect(tableCell().exists()).to.be.eventually.rejectedWith(
        "Table Row and Column Value required",
      );
    });

    it("test tableCell throw error if row=0", async () => {
      expect(() => tableCell({ row: 0, col: 1 })).to.throw(
        'Table Row starts with "1", received "0"',
      );
    });

    it("test tableCell throw error if col=0", async () => {
      expect(() => tableCell({ row: 1, col: 0 })).to.throw(
        'Table Column starts with "1", received "0"',
      );
    });

    it("should fetch footer row using index continuing from body", async () => {
      expect(
        await tableCell({
          row: 5,
          col: 3,
        }).text(),
      ).to.be.oneOf(["Table Footer 3", "Statistics"]); // there are two tables
    });
  });

  describe("using label as Table Caption", () => {
    it("test tableCell exists()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Caption",
        ).exists(),
      ).to.be.true;
    });

    it("test tableCell description", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Caption",
        ).description,
      ).to.be.eql(
        "Table with tableCell at row:1 and column:1 and label Table Caption ",
      );
    });

    it("test tableCell text()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Caption",
        ).text(),
      ).to.be.eql("Table Cell 1.1");
    });

    it("test text should throw if the element is not found", async () => {
      expect(
        tableCell(
          {
            row: 1,
            col: 1,
          },
          "Below Caption",
        ).text(),
      ).to.be.eventually.rejected;
    });

    //TODO Should i move these checks inside the "Parameters validation" describe?
    it("test tableCell throw error if row and col not provided", async () => {
      await expect(
        tableCell("Table Caption").exists(),
      ).to.be.eventually.rejectedWith("Table Row and Column Value required");
    });

    it("test tableCell throw error if row=0", async () => {
      expect(() => tableCell({ row: 0, col: 1 }, "Table Caption")).to.throw(
        'Table Row starts with "1", received "0"',
      );
    });

    it("test tableCell throw error if col=0", async () => {
      expect(() => tableCell({ row: 1, col: 0 }, "Table Caption")).to.throw(
        'Table Column starts with "1", received "0"',
      );
    });

    it("should fetch table by header inside a <tr>", async () => {
      expect(await tableCell({ row: 1, col: 1 }, "Time table").exists()).to.be
        .true;
    });

    it("should fetch footer row using index continuing from body", async () => {
      expect(
        await tableCell(
          {
            row: 5,
            col: 3,
          },
          "Table Caption",
        ).text(),
      ).to.be.eql("Table Footer 3");
    });
  });

  describe("using label as any Table Header", () => {
    it("test tableCell exists()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Heading 1",
        ).exists(),
      ).to.be.true;
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Heading 3",
        ).exists(),
      ).to.be.true;
    });

    it("test tableCell description", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Heading 1",
        ).description,
      ).to.be.eql(
        "Table with tableCell at row:1 and column:1 and label Table Heading 1 ",
      );
    });

    it("test tableCell text()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Heading 1",
        ).text(),
      ).to.be.eql("Table Cell 1.1");
    });

    it("test text should throw if the element is not found", async () => {
      expect(
        tableCell(
          {
            row: 1,
            col: 1,
          },
          "Table Heading 11",
        ).text(),
      ).to.be.eventually.rejected;
    });
  });

  describe("using proximity selectors to locate table", () => {
    it("1 - test tableCell exists()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          below("Tabular data"),
        ).exists(),
      ).to.be.true;
    });

    it("2 - test tableCell exists()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          above("Table Footer 1"),
        ).exists(),
      ).to.be.true;
    });

    it("test tableCell description", async () => {
      expect(
        await tableCell({ row: "1", col: "1" }, below("Tabular data"))
          .description,
      ).to.be.eql(
        "Table with tableCell at row:1 and column:1 and below Tabular data",
      );
    });

    it("1 - test tableCell text()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          below("Tabular Data"),
        ).text(),
      ).to.be.eql("Table Cell 1.1");
    });

    it("2 - test TableCell text()", async () => {
      expect(
        await tableCell(
          {
            row: 1,
            col: 1,
          },
          above("Table Footer 1"),
        ).text(),
      ).to.be.eql("Table Cell 1.1");
    });

    it("test text should throw if the element is not found", async () => {
      await expect(tableCell({ row: 1, col: 1 }, "Table Heading 11").text()).to
        .be.eventually.rejected;
    }).timeout(15000);
  });

  describe("Compatibility with other APIs", () => {
    it("Using tableCell in proximity selector", async () => {
      expect(
        await text(
          "Table Cell 1.2",
          above(tableCell({ row: 2, col: 2 }, "Table Caption")),
        ).exists(),
      ).to.be.true;
    });

    it("Finding link using tableCell in proximity selector", async () => {
      expect(
        await link(
          above(tableCell({ row: 4, col: 1 }, "Table Caption")),
        ).text(),
      ).to.be.eql("[Top]");
    });

    it("Getting value using argValue", async () => {
      expect(await tableCell({ id: "lucky" }).text()).to.be.eql(
        "Table Cell 1.4",
      );
    });

    it("Getting text using proximity selectors", async () => {
      expect(
        await text(
          "Table Cell 1.1",
          near(tableCell({ row: 1, col: 1 }, "Table Caption")),
        ).exists(),
      ).to.be.true;
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => tableCell({ row: 1, col: 1 }, $("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `tableCell` selector. Refer https://docs.taiko.dev/api/tablecell/ for the correct parameters",
      );
    });
  });
});
