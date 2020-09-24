"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const find_1 = tslib_1.__importDefault(require("find"));
const jasmine_1 = tslib_1.__importDefault(require("jasmine"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const command_line_args_1 = tslib_1.__importDefault(require("command-line-args"));
const Logger_1 = tslib_1.__importDefault(require("../src/shared/Logger"));
const options = command_line_args_1.default([
    {
        name: "testFile",
        alias: "f",
        type: String,
    },
]);
const result2 = dotenv_1.default.config({
    path: `./env/test.env`,
});
if (result2.error) {
    throw result2.error;
}
const jasmine = new jasmine_1.default(null);
jasmine.loadConfig({
    random: true,
    spec_dir: "spec",
    spec_files: ["./tests/**/*.spec.ts"],
    stopSpecOnExpectationFailure: false,
});
jasmine.onComplete((passed) => {
    if (passed) {
        Logger_1.default.info("All tests have passed :)");
    }
    else {
        Logger_1.default.error("At least one test has failed :(");
    }
});
if (options.testFile) {
    const testFile = options.testFile;
    find_1.default.file(testFile + ".spec.ts", "./spec", (files) => {
        if (files.length === 1) {
            jasmine.specFiles = [files[0]];
            jasmine.execute();
        }
        else {
            Logger_1.default.error("Test file not found!");
        }
    });
}
else {
    jasmine.execute();
}
//# sourceMappingURL=index.js.map