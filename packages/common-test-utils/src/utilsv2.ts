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
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupVaultsOptsV4,
} from ".";
import {
  PostSetupHookFunction,
  PreSetupHookFunction,
  SetupHookFunction,
} from "./types";

export class TestPresetEntryV4 {
  public preSetupHook: PreSetupHookFunction;
  public testFunc: RunEngineTestFunctionV4;

  constructor(
    func: RunEngineTestFunctionV4,
    opts?: {
      preSetupHook?: PreSetupHookFunction;
    }
  ) {
    let { preSetupHook } = opts || {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.testFunc = func;
  }
}

/**
 * Run engine test with relative vaults
 */
export async function runEngineTestV4(
  func: RunEngineTestFunction,
  opts: {
    preSetupHook?: SetupHookFunction;
    postSetupHook?: PostSetupHookFunction;
    createEngine: CreateEngineFunction;
    expect: any;
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
      preSetupHook: async ({ vpath, vault, wsRoot }) => {
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
        await note2File({ note: rootNote, vault, wsRoot });
      },
    })
  );
  const resp = await EngineTestUtilsV4.setupWS({ wsRoot, setupVaultsOpts });

  await preSetupHook({ wsRoot, vaults: resp.vaults });
  const engine = createEngine({ wsRoot, vaults: resp.vaults });
  await engine.init();
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  const results = await func({ wsRoot, vaults: resp.vaults, engine });

  await runJestHarnessV2(results, expect);
}
