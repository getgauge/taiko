const taiko = require("../../lib/taiko");
const config = require("../../lib/config");
const fs = require("fs");
const path = require("path");
const util = require("util");

(async () => {
  /**
   * This writes a TS file that simply instantiates every function exported by taiko.
   * Then it is possible to dtslint that file and see if any exported function lacks
   * a type definition in index.d.ts.
   */
  async function genTypeTestForTaiko() {
    const BASE_DIR = "./types/taiko/test/generated";
    const FILENAME = "generated-type-test.ts";
    const filePath = path.join(BASE_DIR, FILENAME);

    try {
      await util.promisify(fs.mkdir)(BASE_DIR, { recursive: true });
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(generateTestFileContent());
      writeStream.close();
      return filePath;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    /**
     * Generate the test-file content
     */
    function generateTestFileContent() {
      /**
       * Generates import statements.
       */
      function generateImports() {
        return "import * as taiko from '../../../taiko';\n\n";
      }

      /**
       * Generates statements that instantiate each and every function exported by taiko.
       * Dtslint will look ato those statements and complain if any of the instantiated
       * functions lacks a type definition in index.d.ts.
       */
      function generateTestForTaikoFuncs() {
        const funcs = Object.keys(taiko).filter(
          (item) => item !== "emitter" && item !== "metadata",
        );
        let result = "";
        funcs.sort().forEach(async (item) => (result += `taiko.${item};\n`));
        result += "\n";
        return result;
      }

      /**
       * Generates a statement that instantiates a const of the specified type and assigns the
       * literal to the const.
       * Dtslint will look as the generated function and produce warnings if the fields in
       * the literal and in the type declaration are not consistent.
       * The assignment is wrapped in an exported function to avoid irrelevant lint warnings.
       *
       * @param {string} typeName type to be assigned to the constant producing something
       * like `const a: <typeName> = ...`
       * @param {object} literal value to be assigned to the constant producing something
       * like `const a: <typeName> = <literal>;`
       *
       */
      function generateLiteralToObjectAssignment(typeName, literal) {
        function createNamesFromType() {
          function firstToUpper(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
          }
          const simpleName = typeName.replace(/\./, "");
          const functionName = "get" + firstToUpper(simpleName);
          const constName = "c" + firstToUpper(simpleName);
          return { functionName, constName };
        }
        const { functionName, constName } = createNamesFromType();
        const result =
          `export function ${functionName}(){\n` +
          `const ${constName}: ${typeName} = ${JSON.stringify(literal)};\n` +
          `return ${constName};\n` +
          "}\n\n";
        return result;
      }
      return (
        generateImports() +
        generateTestForTaikoFuncs() +
        generateLiteralToObjectAssignment(
          "taiko.GlobalConfigurationOptions",
          config.defaultConfig,
        )
      );
    }
  }
  return await genTypeTestForTaiko();
})().then((filePath) => console.log("Generated " + filePath));
