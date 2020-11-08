import { DVault } from "@dendronhq/common-all/";
import { EngineTestUtilsV3, FileTestUtils } from "@dendronhq/common-test-utils";

describe("MarkdownPod", () => {
  let vaults: DVault[];
  // let wsRoot: string;
  // let engine: DEngineClientV2;

  test("", async () => {
    vaults = await EngineTestUtilsV3.setupVaults({});
    await FileTestUtils.createFiles(vaults[0].fsPath, [
      { path: "project/p2/n1.md" },
      { path: "project/p1/n1.md" },
      { path: "project/p1/n2.md" },
      { path: "project/p1/.DS_STORE_TEST" },
      { path: "project/p1/n3.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p.3/n1.md" },
    ]);
    expect(vaults).toMatchSnapshot();
  });
});
