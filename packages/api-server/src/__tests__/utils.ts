import { DVault } from "@dendronhq/common-all";
import { DendronAPI, tmpDir } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";

type TestCb = (opts: {
  wsRoot: string;
  vaults: DVault[];
  api: DendronAPI;
}) => Promise<void>;

async function setupAPI({ wsRoot, vault }: { wsRoot: string; vault: string }) {
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
  await api.workspaceInit(payload);
  return api;
}

export async function runTest(cb: TestCb) {
  const wsRoot = tmpDir().name;
  const vaultString = path.join(wsRoot, "vault");
  const vault = { fsPath: vaultString };
  fs.ensureDirSync(vaultString);
  await EngineTestUtilsV2.setupVault({
    vaultDir: vault.fsPath,
    initDirCb: async (vaultPath: string) => {
      await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
        vaultDir: vaultPath,
      });
    },
  });
  const api = await setupAPI({ wsRoot, vault: vaultString });
  await cb({ wsRoot, vaults: [vault], api });
}
