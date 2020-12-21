import { WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "../../../enginev2";
import { DendronASTDest } from "../../types";

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

export const createProcTests = (opts: {
  name: string;
  setupFunc: TestPresetEntryV4["testFunc"];
  verifyFuncDict: { [key in DendronASTDest]: TestPresetEntryV4["testFunc"] };
  preSetupHook?: TestPresetEntryV4["preSetupHook"];
}) => {
  const { name, setupFunc, verifyFuncDict } = opts;
  return Object.values(DendronASTDest).map((dest) => {
    const verifyFunc = verifyFuncDict[dest];
    return {
      name,
      dest,
      testCase: new TestPresetEntryV4(
        async (presetOpts) => {
          const extra = await setupFunc({ ...presetOpts, extra: { dest } });
          return await verifyFunc({ ...presetOpts, extra });
        },
        { preSetupHook: opts.preSetupHook }
      ),
    };
  });
};
