import { DendronAPI, tmpDir } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestUtilsV2,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";

describe("main", () => {
  let wsRoot: string;
  let vaultString: string;

  beforeEach(async () => {
    wsRoot = tmpDir().name;
    vaultString = path.join(wsRoot, "vault");
    fs.ensureDirSync(vaultString);
    await EngineTestUtilsV2.setupVault({
      vaultDir: vaultString,
      initDirCb: (dirPath: string) => {
        NodeTestUtilsV2.createNotes({
          vaultPath: dirPath,
          noteProps: [
            {
              id: "id.foo",
              fname: "foo",
              vault: { fsPath: dirPath },
            },
          ],
        });
      },
    });
  });

  test("one", async () => {
    const payload = {
      uri: wsRoot,
      config: {
        vaults: [vaultString],
      },
    };
    const api = new DendronAPI({
      endpoint: "http://localhost:3005",
      apiPath: "api",
    });
    // @ts-ignore
    let resp = await api.workspaceInit(payload);
    resp = await api.workspaceList();
    // TDOO
  });
});
