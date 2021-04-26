import { tmpDir, vault2Path } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { GitPunchCardExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import { testWithEngine } from "../../engine";
import { checkString, GitTestUtils } from "../../utils";

describe("GitPod", async () => {
  testWithEngine("basic", async ({ engine, wsRoot, vaults }) => {
    const dest = tmpDir().name;
    await Promise.all(
      vaults.map((vault) => {
        return GitTestUtils.createRepoWithReadme(vault2Path({ vault, wsRoot }));
      })
    );
    await GitTestUtils.createRepoWithReadme(wsRoot);
    const gitPunch = new GitPunchCardExportPod();
    await gitPunch.execute({
      engine,
      wsRoot,
      vaults,
      config: {
        dest,
      },
    });
    expect(
      FileTestUtils.cmpFiles(dest, ["commits.csv", "index.html"])
    ).toBeTruthy();
    const csvOutput = fs.readFileSync(path.join(dest, "commits.csv"), {
      encoding: "utf8",
    });
    await checkString(csvOutput, "0,8,53");
    expect(csvOutput.split("\n").length).toEqual(5);
  });
});
