import { tmpDir } from "@dendronhq/common-server";
import { FileAddWatcher } from "@dendronhq/engine-server";
import path from "path";
import fs from "fs-extra";

describe("GIVEN FileAddWatcher", () => {
  const testFile = "test-file.yml";

  describe("WHEN watched file is added directly to the watched folder", () => {
    test("THEN it detects the file", (done) => {
      const testDir = tmpDir().name;
      const watcher = new FileAddWatcher([testDir], testFile, (filePath) => {
        expect(path.basename(filePath)).toEqual(testFile);
        expect(path.dirname(filePath)).toEqual(testDir);
        watcher.dispose();
        done();
      });
      fs.writeFileSync(path.join(testDir, testFile), "");
    });
  });

  describe("WHEN watched file is added to a subdirectory", () => {
    test("THEN it detects the file", (done) => {
      const testDir = tmpDir().name;
      const subDir = path.join(testDir, "subdir");
      fs.ensureDirSync(subDir);

      const watcher = new FileAddWatcher([testDir], testFile, (filePath) => {
        expect(path.basename(filePath)).toEqual(testFile);
        expect(path.dirname(filePath)).toEqual(subDir);
        watcher.dispose();
        done();
      });
      fs.writeFileSync(path.join(subDir, testFile), "");
    });
  });
});
