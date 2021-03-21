import { DendronAPI } from "@dendronhq/common-server";
import _ from "lodash";
import { createServer, runEngineTestV5 } from "../../engine";

describe("workspace", () => {
  test("basic", async () => {
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
});
