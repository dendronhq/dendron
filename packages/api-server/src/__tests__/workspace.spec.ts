import { tmpDir, DendronAPI } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestUtilsV2,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";

describe("main", () => {
  let wsRoot: string;
  let vault: string;

  beforeEach(async () => {
    wsRoot = tmpDir().name;
    vault = path.join(wsRoot, "vault");
    fs.ensureDirSync(vault);
    await EngineTestUtilsV2.setupVault({
      vaultDir: vault,
      initDirCb: (dirPath: string) => {
        NodeTestUtilsV2.createNotes({
          vaultPath: dirPath,
          noteProps: [
            {
              id: "id.foo",
              fname: "foo",
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
        vaults: [vault],
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
