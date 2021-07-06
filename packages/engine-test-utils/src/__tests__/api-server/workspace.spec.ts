import { DendronAPI } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { tmpDir } from "../../../../common-server/lib";
import { createServer, runEngineTestV5 } from "../../engine";

describe("workspace", () => {
  test("ok: basic", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const { port } = await createServer({ wsRoot, vaults });
        const payload = {
          uri: wsRoot,
          config: {
            vaults,
          },
        };
        const api = new DendronAPI({
          endpoint: `http://localhost:${port}`,
          apiPath: "api",
        });
        let resp = await api.workspaceInit(payload);
        expect(resp.data?.notes).toEqual(engine.notes);
        let resp2 = await api.workspaceList();
        expect(_.size(resp2.data?.workspaces)).toEqual(1);
      },
      { expect }
    );
  });

  test("ok: mixed case path", async () => {
    const wsRoot = path.join(tmpDir().name, "FOO");
    fs.ensureDirSync(wsRoot);

    await runEngineTestV5(
      async ({ vaults, engine }) => {
        const { port } = await createServer({ wsRoot, vaults });
        const payload = {
          uri: wsRoot,
          config: {
            vaults,
          },
        };
        const api = new DendronAPI({
          endpoint: `http://localhost:${port}`,
          apiPath: "api",
        });
        let resp = await api.workspaceInit(payload);
        expect(resp.data?.notes).toEqual(engine.notes);
        let resp2 = await api.workspaceList();
        expect(
          _.takeRight(resp2.data!["workspaces"], 1)[0].endsWith("foo")
        ).toBeTruthy();
      },
      { expect, wsRoot }
    );
  });
});
