import {
  DendronConfig,
  DEngineClient,
  DVault,
  NotePropsDict,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { EngineState } from "./features/engine/slice";

// @ts-ignore
export class WebEngine implements DEngineClient {
  public notes: NotePropsDict;
  public wsRoot: string;
  public schemas: SchemaModuleDict;
  public configRoot: string;
  public vaults: DVault[];
  // public links: DLink[];
  // public fuseEngine: FuseEngine;
  // public api: DendronAPI;
  // public history?: HistoryService;
  // public logger: DLogger;
  public config: DendronConfig;
  // public hooks: DHookDict;

  static create(state: Required<EngineState>) {
    return new WebEngine(state);
  }
  constructor(state: Required<EngineState>) {
    const { notes, wsRoot, schemas, vaults, config } = state;
    this.notes = notes;
    this.wsRoot = wsRoot;
    this.schemas = schemas;
    this.vaults = vaults;
    this.configRoot = wsRoot;
    this.config = config;
  }
}
