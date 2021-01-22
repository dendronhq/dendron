import { NotePropsV2, WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  getLogFilePath,
  NoteTestUtilsV4,
  TestPresetEntryV4,
  AssertUtils,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "../../../enginev2";
import { DendronASTDest, Processor } from "../../types";
import _ from "lodash";
import { MDUtilsV4 } from "../../utils";
import path from "path";
import fs from "fs";
import { VFile } from "vfile";

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
  const logger = createLogger("testLogger", getLogFilePath("engine-server"));
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};

export const createProc = async (
  opts: Parameters<TestPresetEntryV4["testFunc"]>[0],
  procOverride?: Partial<Parameters<typeof MDUtilsV4.procFull>[0]>
) => {
  const { engine, vaults, extra } = opts;
  const proc = await MDUtilsV4.procFull(
    _.defaults(
      {
        engine,
        dest: extra.dest,
        fname: "foo",
        vault: vaults[0],
      },
      procOverride
    )
  );
  return proc;
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

export const checkContents = async (
  respProcess: VFile,
  cmp: string | string[]
) => {
  if (!_.isArray(cmp)) {
    cmp = [cmp];
  }
  expect(
    await AssertUtils.assertInString({
      body: respProcess.contents as string,
      match: cmp,
    })
  ).toBeTruthy();
};

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

export const modifyNote = async (
  opts: WorkspaceOpts,
  fname: string,
  cb: (note: NotePropsV2) => NotePropsV2
) => {
  await NoteTestUtilsV4.modifyNoteByPath(
    { wsRoot: opts.wsRoot, vault: opts.vaults[0], fname },
    cb
  );
};

export const processText = (opts: { text: string; proc: Processor }) => {
  const { text, proc } = opts;
  const respParse = proc.parse(text);
  const respProcess = proc.processSync(text);
  return { proc, respParse, respProcess };
};

export const processNote = (opts: {
  fname: string;
  proc: Processor;
  wopts: WorkspaceOpts;
}) => {
  const { fname, wopts, proc } = opts;
  const npath = path.join(wopts.wsRoot, wopts.vaults[0].fsPath, fname + ".md");
  const text = fs.readFileSync(npath, { encoding: "utf8" });
  return processText({ text, proc });
};
