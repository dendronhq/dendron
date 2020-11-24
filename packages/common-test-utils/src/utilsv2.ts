import { NoteUtilsV2, SchemaUtilsV2 } from "@dendronhq/common-all";
import {
  note2File,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import _ from "lodash";
import {
  CreateEngineFunction,
  EngineTestUtilsV4,
  RunEngineTestFunction,
  SetupVaultsOptsV4,
} from ".";
import { PostSetupHookFunction, SetupHookFunction } from "./types";

/**
 * Run engine test with relative vaults
 */
export async function runEngineTestV4(
  func: RunEngineTestFunction,
  opts: {
    preSetupHook?: SetupHookFunction;
    postSetupHook?: PostSetupHookFunction;
    createEngine: CreateEngineFunction;
  }
) {
  const { preSetupHook, createEngine } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
  });

  // setup root and vaults
  const wsRoot = tmpDir().name;
  const setupVaultsOpts: SetupVaultsOptsV4[] = ["vault1", "vault2"].map(
    (ent) => ({
      vault: { fsPath: ent },
      preSetupHook: async ({ vpath, vault }) => {
        const rootModule = SchemaUtilsV2.createRootModule({
          created: "1",
          updated: "1",
          vault,
        });
        await schemaModuleOpts2File(rootModule, vpath, "root");

        const rootNote = await NoteUtilsV2.createRoot({
          created: "1",
          updated: "1",
          vault,
        });
        await note2File(rootNote, vpath);
      },
    })
  );
  const resp = await EngineTestUtilsV4.setupWS({ wsRoot, setupVaultsOpts });

  await preSetupHook({ wsRoot, vaults: resp.vaults });
  const engine = createEngine({ wsRoot, vaults: resp.vaults });
  await engine.init();
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  await func({ wsRoot, vaults: resp.vaults, engine });
}
