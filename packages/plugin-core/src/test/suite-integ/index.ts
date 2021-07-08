import Mocha from "mocha";
import glob from "glob";
import path from "path";

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, ".");

  return new Promise((c, e) => {
    const fname = process.env.TEST_TO_RUN;
    // uncomment to run tests remotely
    // fname = '[UV]*.test'
    let pattern = "**/*.test.js";
    if (fname && fname !== "") {
      pattern = `**/${fname}.js`;
    }
    glob(pattern, { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }
      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
      console.log(`running tests on ${files}`);

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
}
