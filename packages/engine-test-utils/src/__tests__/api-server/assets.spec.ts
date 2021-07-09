import { DendronAPI, DendronError, WorkspaceOpts } from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import path from "path";
import { createServer, runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { checkFile, checkString } from "../../utils";

async function initRemoteWorkspace({
  wsRoot,
  vaults,
  api,
}: WorkspaceOpts & { api: DendronAPI }) {
  const payload = {
    uri: wsRoot,
    config: {
      vaults,
    },
  };
  const resp = await api.workspaceInit(payload);
  return resp;
}

describe("assets/get", () => {
  test("fail: asset not in workspace", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const { port } = await createServer({ wsRoot, vaults });
        const api = new DendronAPI({
          endpoint: `http://localhost:${port}`,
          apiPath: "api",
        });
        await initRemoteWorkspace({ wsRoot, vaults, api });
        const fpath = tmpDir().name;
        const resp = await api.assetGet({ fpath, ws: wsRoot });
        await checkString((resp as DendronError).message, "not inside a vault");
      },
      { expect }
    );
  });

  test("fail: path not exist", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const { port } = await createServer({ wsRoot, vaults });
        const api = new DendronAPI({
          endpoint: `http://localhost:${port}`,
          apiPath: "api",
        });
        await initRemoteWorkspace({ wsRoot, vaults, api });
        const vpath = vault2Path({ vault: vaults[0], wsRoot });
        const fpath = path.join(vpath, "not-exist.md");
        const resp = await api.assetGet({ fpath, ws: wsRoot });
        await checkString((resp as DendronError).message, "does not exist");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("ok", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const { port } = await createServer({ wsRoot, vaults });
        const api = new DendronAPI({
          endpoint: `http://localhost:${port}`,
          apiPath: "api",
        });
        await initRemoteWorkspace({ wsRoot, vaults, api });
        const vpath = vault2Path({ vault: vaults[0], wsRoot });
        const fpath = path.join(vpath, "foo.md");
        const resp = await api.assetGet({ fpath, ws: wsRoot });
        checkFile({ fpath }, resp as unknown as string);
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
