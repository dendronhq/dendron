import {
  DEngineClientV2,
  DEngineInitRespV2,
  DLink,
  DNodeTypeV2,
  DVault,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  QueryNotesOpts,
  QueryOptsV2,
  RenameNoteOptsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
} from "@dendronhq/common-all";
import { DendronAPI, tmpDir } from "@dendronhq/common-server";
import _ from "lodash";
import {
  PostSetupHookFunction,
  SetupHookFunction,
  TestResult,
  WorkspaceOpts,
} from "./types";
import assert from "assert";
import { EngineTestUtilsV3, NotePresetsUtils } from ".";

export const toPlainObject = <R>(value: unknown): R =>
  value !== undefined ? JSON.parse(JSON.stringify(value)) : value;

export class AssertUtils {
  static async assertInString({
    body,
    match,
    nomatch,
  }: {
    body: string;
    match: string[];
    nomatch?: string[];
  }): Promise<boolean> {
    await Promise.all(
      match.map((m) => {
        if (body.indexOf(m) < 0) {
          throw `${m} not found in ${body}`;
        }
        return true;
      })
    );
    await Promise.all(
      (nomatch || []).map((m) => {
        if (body.indexOf(m) > 0) {
          throw `${m} found in ${body}`;
        }
        return true;
      })
    );
    return true;
  }
}

export class EngineAPIShim implements DEngineClientV2 {
  public api: DendronAPI;
  public wsRoot: string;
  public vaults: string[];
  public notes: NotePropsDictV2;
  public schemas: SchemaModuleDictV2;
  public links: DLink[];
  public vaultsv3: DVault[];

  constructor({
    api,
    wsRoot,
    vaults,
  }: {
    api: DendronAPI;
    wsRoot: string;
    vaults: string[];
  }) {
    this.api = api;
    this.wsRoot = wsRoot;
    this.vaults = vaults;
    this.notes = {};
    this.schemas = {};
    this.links = [];
    this.vaultsv3 = [];
  }
  async init() {
    const { api, wsRoot, vaults } = this;
    const vault = vaults[0];
    const payload = {
      uri: wsRoot,
      config: {
        vaults: [vault],
      },
    };
    const resp = await api.workspaceInit(payload);
    const { data } = resp;
    const { notes, schemas } = data || { notes: {}, schemas: {} };
    this.notes = notes;
    this.schemas = schemas;
    return resp as DEngineInitRespV2;
  }

  async deleteNote(_id: string, _opts?: EngineDeleteOptsV2) {
    return {} as any;
  }
  async deleteSchema(_id: string, _opts?: EngineDeleteOptsV2) {
    return {} as any;
  }

  async getNoteByPath(_opts: GetNoteOptsV2) {
    return {} as any;
  }
  async getSchema(_qs: string) {
    return {} as any;
  }

  async querySchema(_qs: string) {
    return {} as any;
  }
  async queryNotes(_opts: QueryNotesOpts) {
    return {} as any;
  }

  async query(_queryString: string, _mode: DNodeTypeV2, _opts?: QueryOptsV2) {
    return {} as any;
  }

  queryNotesSync({}: { qs: string }) {
    throw Error("queryNoteSync not implemented");
    return {} as any;
  }

  async sync() {
    throw Error("sync not implemented");
    return {} as any;
  }

  async renameNote(opts: RenameNoteOptsV2) {
    return await this.api.engineRenameNote({ ws: this.wsRoot, ...opts });
  }

  async updateNote(note: NotePropsV2, opts?: EngineUpdateNodesOptsV2) {
    await this.api.engineUpdateNote({ ws: this.wsRoot, note, opts });
    return;
  }

  async writeNote(note: NotePropsV2, opts?: EngineWriteOptsV2) {
    const resp = await this.api.engineWrite({
      ws: this.wsRoot,
      node: note,
      opts,
    });
    return resp;
  }
  async writeSchema(_schema: SchemaModulePropsV2) {
    return {} as any;
  }
  async updateSchema(_schema: SchemaModulePropsV2) {
    return {} as any;
  }
}

export abstract class EngineTest<TPreSetupOut = any, TPostSetupOut = any> {
  public preSetupHook: SetupHookFunction<TPreSetupOut>;
  public postSetupHook: SetupHookFunction<TPostSetupOut>;
  public engine: DEngineClientV2;

  constructor(opts: {
    preSetupHook?: SetupHookFunction<TPreSetupOut>;
    postSetupHook?: SetupHookFunction<TPostSetupOut>;
    engine: DEngineClientV2;
  }) {
    const { preSetupHook, postSetupHook, engine } = _.defaults(opts, {
      preSetupHook: async () => {},
      postSetupHook: async () => {},
    });
    this.preSetupHook = preSetupHook;
    this.postSetupHook = postSetupHook;
    this.engine = engine;
  }

  runJest = () => {};
  runMocha = () => {};
}

export class TestPresetEntry<TBeforeOpts, TAfterOpts, TResultsOpts> {
  public label: string;
  public before: (_opts: TBeforeOpts) => Promise<any>;
  public preSetupHook: SetupHookFunction;
  public postSetupHook: SetupHookFunction;
  public after: (_opts: TAfterOpts) => Promise<any>;
  public results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  public init: () => Promise<void>;

  constructor({
    label,
    results,
    before,
    after,
    preSetupHook,
    postSetupHook,
  }: {
    label: string;
    preSetupHook?: SetupHookFunction;
    postSetupHook?: SetupHookFunction;
    beforeSetup?: (_opts: TBeforeOpts) => Promise<any>;
    before?: (_opts: TBeforeOpts) => Promise<any>;
    after?: (_opts: TAfterOpts) => Promise<any>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  }) {
    this.label = label;
    this.results = results;
    this.before = before ? before : async () => {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.after = after ? after : async () => {};
    this.init = async () => {};
  }
}

export async function runMochaHarness<TOpts>(results: any, opts?: TOpts) {
  return _.map(await results(opts), (ent) =>
    assert.deepStrictEqual(ent.actual, ent.expected)
  );
}

export async function runJestHarness<TOpts>(
  results: any,
  expect: jest.Expect,
  opts?: TOpts
) {
  return _.map(await results(opts), (ent) =>
    expect(ent.actual).toEqual(ent.expected)
  );
}

export async function runJestHarnessV2(results: any, expect: jest.Expect) {
  return _.map(await results, (ent) =>
    expect(ent.actual).toEqual(ent.expected)
  );
}

export type RunEngineTestFunctionOpts = {
  engine: DEngineClientV2;
} & WorkspaceOpts;
export type RunEngineTestFunction = (
  opts: RunEngineTestFunctionOpts
) => Promise<any>;
export type CreateEngineFunction = (opts: WorkspaceOpts) => DEngineClientV2;

export async function runEngineTest(
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

  const wsRoot = tmpDir().name;
  const vaults = await EngineTestUtilsV3.setupVaults({
    initVault1: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "foo" });
    },
    initVault2: async (vaultDir: string) => {
      await NotePresetsUtils.createBasic({ vaultDir, fname: "bar" });
    },
  });
  await preSetupHook({ wsRoot, vaults });
  const engine = createEngine({ wsRoot, vaults });
  await engine.init();
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  await func({ wsRoot, vaults, engine });
}
