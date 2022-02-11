import {
  IntermediateDendronConfig,
  DEngineClient,
  DuplicateNoteActionEnum,
  DVault,
} from "@dendronhq/common-all";
import {
  AssertUtils,
  RunEngineTestFunctionV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  MDUtilsV5,
  Processor,
  ProcFlavor,
  VFile,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

type ProcVerifyOpts = Required<
  Parameters<
    RunEngineTestFunctionV4<
      any,
      {
        dest: DendronASTDest;
        proc: Processor;
        // vfile contents can be uint8 array, force it to be string
        resp: VFile & { contents: string };
      }
    >
  >[0]
>;

export async function checkVFile(resp: VFile, ...match: string[]) {
  expect(resp).toMatchSnapshot();
  expect(
    await AssertUtils.assertInString({
      body: resp.toString(),
      match,
    })
  ).toBeTruthy();
}

export async function checkNotInVFile(resp: VFile, ...nomatch: string[]) {
  expect(resp).toMatchSnapshot();
  expect(
    await AssertUtils.assertInString({
      body: resp.toString(),
      nomatch,
    })
  ).toBeTruthy();
}

export const createProcForTest = (opts: {
  engine: DEngineClient;
  dest: DendronASTDest;
  vault: DVault;
  fname?: string;
  useIdAsLink?: boolean;
}) => {
  const { engine, dest, vault, fname } = opts;
  // This was false by default for MDUtilsV4, but became true for MDUtilsV5.
  // Using IDs for the links breaks snapshots since note ids are random.
  if (opts.useIdAsLink === undefined) opts.useIdAsLink = false;
  const data = {
    engine,
    dest,
    fname: fname || "root",
    vault,
    wikiLinksOpts: {
      useId: opts.useIdAsLink,
    },
    publishOpts: {
      wikiLinkOpts: {
        useId: opts.useIdAsLink,
      },
    },
  };
  if (dest === DendronASTDest.HTML) {
    return MDUtilsV5.procRehypeFull(data);
  } else {
    return MDUtilsV5.procRemarkFull(data);
  }
};

export type ProcTests = {
  name: string;
  dest: DendronASTDest;
  flavor: ProcFlavor;
  testCase: TestPresetEntryV4;
};

export const cleanVerifyOpts = (opts: any): ProcVerifyOpts => {
  return opts as ProcVerifyOpts;
};

/**
 * Generator for processor tests
 *
 * @param name name of test
 * @param setupFunc function {@link SetupTestFunctionV4} with `extra` param of {dest: {@link DendronASTDest}}
 * @param verifyFuncDict hash of various test functions
 */
export const createProcTests = (opts: {
  name: string;
  skip?: boolean;
  setupFunc: TestPresetEntryV4["testFunc"];
  verifyFuncDict?: {
    [key in DendronASTDest]?: TestPresetEntryV4["testFunc"] | DendronASTDest;
  };
  preSetupHook?: TestPresetEntryV4["preSetupHook"];
}): ProcTests[] => {
  const { name, setupFunc, verifyFuncDict, skip } = opts;
  if (skip) return [];
  let allTests: ProcTests[] = [];
  if (verifyFuncDict) {
    allTests = Object.values(DendronASTDest)
      .map((dest) => {
        const funcOrKey = verifyFuncDict[dest];
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
              return verifyFunc({ ...presetOpts, extra });
            },
            { preSetupHook: opts.preSetupHook }
          ),
        };
      })
      .filter((ent) => !_.isUndefined(ent)) as ProcTests[];
  }
  return allTests;
};

type TestFunc = TestPresetEntryV4["testFunc"];

type FlavorDict = { [key in ProcFlavor]?: TestFunc | ProcFlavor };

/**
 * Create test cases for different processor destinations
 * - NOTE: by default, assume the `fname` passed to processor is `foo`
 * @param opts.setup: use this to run processor against custom text
 */
export const createProcCompileTests = (opts: {
  name: string;
  fname?: string;
  setup: TestPresetEntryV4["testFunc"];
  verify?: {
    [key in DendronASTDest]?: FlavorDict;
  };
  preSetupHook?: TestPresetEntryV4["preSetupHook"];
}): ProcTests[] => {
  const {
    name,
    setup: setupFunc,
    verify: verifyFuncDict,
    fname,
  } = _.defaults(opts, {
    fname: "foo",
  });
  let allTests: ProcTests[] = [];
  if (verifyFuncDict) {
    allTests = Object.values(DendronASTDest)
      .flatMap((dest) => {
        const verifyFuncsByFlavor = verifyFuncDict[dest] || {};
        return _.flatMap(verifyFuncsByFlavor, (funcOrFlavor, flavor) => {
          let verifyFunc: TestPresetEntryV4["testFunc"];
          if (_.isUndefined(funcOrFlavor)) {
            return;
          }

          if (_.isFunction(funcOrFlavor)) {
            verifyFunc = funcOrFlavor;
          } else {
            const maybeFunc = verifyFuncsByFlavor[funcOrFlavor];
            if (_.isUndefined(maybeFunc)) {
              throw new Error(
                `test ${name} -> ${dest} -> ${flavor} points to ${funcOrFlavor} which is undefined`
              );
            }
            if (_.isString(maybeFunc)) {
              throw new Error(
                `test ${name} -> ${dest} -> ${flavor} points to ${funcOrFlavor} which is also a string`
              );
            }
            verifyFunc = maybeFunc;
          }
          return {
            name,
            dest,
            flavor,
            testCase: new TestPresetEntryV4(
              async (presetOpts) => {
                const { engine, vaults } = presetOpts;
                const vault = vaults[0];
                let proc: Processor;
                switch (dest) {
                  case DendronASTDest.HTML:
                    proc = MDUtilsV5.procRehypeFull(
                      { engine, fname, vault },
                      { flavor: flavor as ProcFlavor }
                    );
                    break;
                  default:
                    proc = MDUtilsV5.procRemarkFull(
                      {
                        dest,
                        engine,
                        fname,
                        vault,
                      },
                      { flavor: flavor as ProcFlavor }
                    );
                }
                const extra = await setupFunc({
                  ...presetOpts,
                  extra: { dest, proc },
                });
                return verifyFunc({ ...presetOpts, extra });
              },
              { preSetupHook: opts.preSetupHook }
            ),
          };
        });
      })
      .filter((ent) => !_.isUndefined(ent)) as ProcTests[];
  }
  return allTests;
};

export const dupNote = (payload: DVault | string[]) => {
  const out: any = {
    duplicateNoteBehavior: {
      action: DuplicateNoteActionEnum.useVault,
    },
  };
  if (_.isArray(payload)) {
    out.duplicateNoteBehavior.payload = payload;
  } else {
    out.duplicateNoteBehavior.payload = {
      vault: payload,
    };
  }
  return out;
};

export function genDendronData(
  opts?: Partial<DendronASTData>
): DendronASTData & { fname: string } {
  return { ...opts } as any;
}

export const generateVerifyFunction = (opts: {
  target: DendronASTDest;
  exclude?: DendronASTDest[];
}) => {
  const { target, exclude } = _.defaults(opts, { exclude: [] });
  const out: any = {};
  const excludeList = exclude.concat(target);
  Object.values(DendronASTDest)
    .filter((ent) => !_.includes(excludeList, ent))
    .forEach((ent) => {
      out[ent] = target;
    });
  return out;
};

type ProcessTextV2Opts = {
  text: string;
  dest: DendronASTDest.HTML;
  engine: DEngineClient;
  fname: string;
  vault: DVault;
  configOverride?: IntermediateDendronConfig;
};

export const processTextV2 = async (opts: ProcessTextV2Opts) => {
  const { engine, text, fname, vault, configOverride } = opts;
  if (opts.dest !== DendronASTDest.HTML) {
    const proc = MDUtilsV5.procRemarkFull({
      engine,
      config: configOverride,
      fname,
      dest: opts.dest,
      vault,
    });
    const resp = await proc.process(text);
    return { resp };
  } else {
    const proc = MDUtilsV5.procRehypeFull({
      engine,
      config: configOverride,
      fname,
      vault,
      // Otherwise links generated in tests use randomly generated IDs which is unstable for snaps
      wikiLinksOpts: {
        useId: false,
      },
      publishOpts: {
        wikiLinkOpts: {
          useId: false,
        },
      },
    });
    const resp = await proc.process(text);
    return { resp };
  }
};

export const processNote = async (opts: Omit<ProcessTextV2Opts, "text">) => {
  const { fname, engine, vault } = opts;
  const npath = path.join(engine.wsRoot, vault.fsPath, fname + ".md");
  const text = await fs.readFile(npath, { encoding: "utf8" });
  return processTextV2({ text, ...opts });
};
