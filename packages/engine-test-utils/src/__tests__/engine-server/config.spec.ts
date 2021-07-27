import { DConfig } from "@dendronhq/engine-server";
import path from "path";

// Currently skipping this test due to the need for DConfig.getOrCreate() to call writeYAML
describe.skip("DConfig tests", () => {

  test("test os path correction", (done) => {
    const config = DConfig.getOrCreate("tmp-path", {
      vaults: [{ fsPath: "foo/bar" }, { fsPath: "foo\\bar" }],
    });
    config.vaults.forEach((vault) => {
      expect(vault.fsPath).toEqual(path.join("foo", "bar"));
    });
    done();
  });
});
