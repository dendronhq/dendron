import { WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "../../../enginev2";

export const basicSetup = async ({ wsRoot, vaults }: WorkspaceOpts) => {
  await NoteTestUtilsV4.createNote({
    wsRoot,
    fname: "foo",
    body: "foo body",
    vault: vaults[0],
    props: { id: "foo-id" },
  });
};

export const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", "/tmp/engine-server.txt");
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};
