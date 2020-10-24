import {
  DEngineClientV2,
  DEngineInitRespV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  NotePropsV2,
  RenameNoteOptsV2,
} from "@dendronhq/common-all";
import { DendronAPI } from "@dendronhq/common-server";
import { TestResult } from "./types";

// @ts-ignore
export class EngineAPIShim implements DEngineClientV2 {
  public api: DendronAPI;
  public wsRoot: string;
  public vaults: string[];

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
    return resp as DEngineInitRespV2;
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
}

export class TestPresetEntry<TBeforeOpts, TAfterOpts, TResultsOpts> {
  public label: string;
  public before: (_opts: TBeforeOpts) => Promise<any>;
  public after: (_opts: TAfterOpts) => Promise<any>;
  public results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  public init: () => Promise<void>;

  constructor({
    label,
    results,
    before,
    after,
  }: {
    label: string;
    before?: (_opts: TBeforeOpts) => Promise<any>;
    after?: (_opts: TAfterOpts) => Promise<any>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
    //init?: ({engine}: {engine: DEngineV2}) => Promise<void>;
  }) {
    this.label = label;
    this.results = results;
    this.before = before ? before : async () => {};
    this.after = after ? after : async () => {};
    this.init = async () => {};
  }
}
