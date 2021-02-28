import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, MDUtilsV4, VFile } from "@dendronhq/engine-server";
import _ from "lodash";

export async function checkVFile(resp: VFile, ...match: string[]) {
  expect(resp).toMatchSnapshot();
  expect(
    await AssertUtils.assertInString({
      body: resp.toString(),
      match,
    })
  ).toBeTruthy();
}

export const createProcForTest = (opts: {
  engine: DEngineClientV2;
  dest: DendronASTDest;
  vault: DVault;
  useIdAsLink?: boolean;
}) => {
  const { engine, dest, vault } = opts;
  const proc2 = MDUtilsV4.procFull({
    engine,
    dest,
    fname: "root",
    vault,
    wikiLinksOpts: {
      useId: opts.useIdAsLink,
    },
    publishOpts: {
      wikiLinkOpts: {
        useId: opts.useIdAsLink,
      },
    },
  });
  if (dest === DendronASTDest.HTML) {
    return MDUtilsV4.procRehype({ proc: proc2 });
  } else {
    return proc2;
  }
};

export const createProcTests = (opts: {
  name: string;
  setupFunc: TestPresetEntryV4["testFunc"];
  verifyFuncDict?: {
    [key in DendronASTDest]?: TestPresetEntryV4["testFunc"] | DendronASTDest;
  };
  preSetupHook?: TestPresetEntryV4["preSetupHook"];
}) => {
  const { name, setupFunc, verifyFuncDict } = opts;
  let allTests: any = [];
  if (verifyFuncDict) {
    allTests = Object.values(DendronASTDest)
      .map((dest) => {
        let funcOrKey = verifyFuncDict[dest];
        let verifyFunc: TestPresetEntryV4["testFunc"];
        if (_.isUndefined(funcOrKey)) {
          return;
        }
        if (_.isString(funcOrKey)) {
          verifyFunc = verifyFuncDict[
            funcOrKey
          ] as TestPresetEntryV4["testFunc"];
        } else {
          verifyFunc = funcOrKey;
        }
        return {
          name,
          dest,
          testCase: new TestPresetEntryV4(
            async (presetOpts) => {
              const extra = await setupFunc({
                ...presetOpts,
                extra: { dest },
              });
              return await verifyFunc({ ...presetOpts, extra });
            },
            { preSetupHook: opts.preSetupHook }
          ),
        };
      })
      .filter((ent) => !_.isUndefined(ent));
  }
  return allTests;
};
