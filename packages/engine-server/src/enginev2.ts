import {
  ConfigWriteOpts,
  DendronConfig,
  DendronError,
  DEngineClientV2,
  DEngineDeleteSchemaRespV2,
  DEngineInitRespV2,
  DEngineMode,
  DEngineV2,
  DLink,
  DNodeTypeV2,
  DStoreV2,
  DVault,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNoteOptsV2,
  GetNotePayloadV2,
  NoteChangeEntry,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  QueryNotesOpts,
  RenameNoteOptsV2,
  RenameNotePayload,
  RespV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaQueryResp,
  VaultUtils,
  WorkspaceOpts,
  WriteNoteResp,
} from "@dendronhq/common-all";
import {
  createLogger,
  DLogger,
  NodeJSUtils,
  readYAML,
  writeYAML,
} from "@dendronhq/common-server";
import _ from "lodash";
import { DConfig } from "./config";
import { FileStorageV2 } from "./drivers/file/storev2";
import { FuseEngine } from "./fuseEngine";
import { ParserUtilsV2 } from "./topics/markdown/utilsv2";

type CreateStoreFunc = (engine: DEngineClientV2) => DStoreV2;
type DendronEngineOptsV2 = {
  wsRoot: string;
  vaultsv3: DVault[];
  forceNew?: boolean;
  createStore?: CreateStoreFunc;
  mode?: DEngineMode;
  logger?: DLogger;
  config: DendronConfig;
};
type DendronEnginePropsV2 = Required<DendronEngineOptsV2>;

export class DendronEngineV2 implements DEngineV2 {
  public wsRoot: string;
  public store: DStoreV2;
  protected props: DendronEnginePropsV2;
  public logger: DLogger;
  public fuseEngine: FuseEngine;
  public links: DLink[];
  public vaultsv3: DVault[];
  public configRoot: string;
  public config: DendronConfig;

  static _instance: DendronEngineV2 | undefined;

  constructor(props: DendronEnginePropsV2) {
    this.wsRoot = props.wsRoot;
    this.configRoot = props.wsRoot;
    this.logger = props.logger;
    this.props = props;
    this.fuseEngine = new FuseEngine({});
    this.links = [];
    this.vaultsv3 = props.vaultsv3;
    this.config = props.config;
    this.store = props.createStore(this);
  }

  static createV3({
    vaults,
    wsRoot,
    logger,
  }: WorkspaceOpts & { logger?: DLogger }) {
    const LOGGER = logger || createLogger();
    const cpath = DConfig.configPath(wsRoot);
    const config = readYAML(cpath) as DendronConfig;
    return new DendronEngineV2({
      wsRoot,
      vaultsv3: vaults,
      forceNew: true,
      createStore: (engine) =>
        new FileStorageV2({
          engine,
          logger: LOGGER,
        }),
      mode: "fuzzy",
      logger: LOGGER,
      config,
    });
  }

  static instance({ vaults, wsRoot }: { vaults: DVault[]; wsRoot: string }) {
    if (!DendronEngineV2._instance) {
      DendronEngineV2._instance = DendronEngineV2.createV3({ vaults, wsRoot });
    }
    return DendronEngineV2._instance;
  }

  get notes(): NotePropsDictV2 {
    return this.store.notes;
  }
  get schemas(): SchemaModuleDictV2 {
    return this.store.schemas;
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<DEngineInitRespV2> {
    try {
      const { data, error } = await this.store.init();
      const { notes, schemas } = data;
      this.updateIndex("note");
      this.updateIndex("schema");
      return {
        error,
        data: { notes, schemas },
      };
    } catch (error) {
      const { message, stack, msg, status, friendly } = error;
      let payload = { message, stack };
      return {
        error: new DendronError({ payload, msg, status, friendly }),
        data: {
          notes: {},
          schemas: {},
        },
      };
    }
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOptsV2
  ): ReturnType<DEngineClientV2["deleteNote"]> {
    try {
      const note = this.notes[id];
      const changed = await this.store.deleteNote(id, opts);
      const noteChangeEntry = _.find(
        changed,
        (ent) => ent.note.id === id
      ) as NoteChangeEntry;
      if (noteChangeEntry.status === "delete") {
        await this.fuseEngine.removeNoteFromIndex(note);
      }
      return {
        data: changed,
        error: null,
      };
    } catch (err) {
      return {
        data: [],
        error: err,
      };
    }
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<DEngineDeleteSchemaRespV2> {
    try {
      const data = (await this.store.deleteSchema(
        id,
        opts
      )) as DEngineDeleteSchemaRespV2;
      // deleted schema might affect notes
      await this.updateIndex("note");
      await this.updateIndex("schema");
      return data;
      // FIXM:E not performant
      // const smod = this.schemas[id];
      // await this.fuseEngine.removeSchemaFromIndex(smod);
      // return {
      //   data: undefined,
      //   error: null,
      // };
    } catch (err) {
      return {
        data: {
          notes: {},
          schemas: {},
        },
        error: err,
      };
    }
  }

  async getNoteByPath({
    npath,
    createIfNew,
    vault,
    overrides,
  }: GetNoteOptsV2): Promise<RespV2<GetNotePayloadV2>> {
    const ctx = "getNoteByPath";
    this.logger.debug({ ctx, npath, createIfNew, msg: "enter" });
    const maybeNote = NoteUtilsV2.getNoteByFnameV5({
      fname: npath,
      notes: this.notes,
      vault,
      wsRoot: this.wsRoot,
    });
    this.logger.debug({ ctx, maybeNote, msg: "post-query" });
    let noteNew: NotePropsV2 | undefined = maybeNote;
    let changed: NoteChangeEntry[] = [];
    let error = null;
    let updateExisting = false;
    if ((!maybeNote || maybeNote.stub) && createIfNew) {
      this.logger.debug({ ctx, maybeNote, msg: "create-new" });
      if (maybeNote?.stub) {
        noteNew = maybeNote;
        delete noteNew.stub;
        updateExisting = true;
      } else {
        noteNew = NoteUtilsV2.createWithSchema({
          noteOpts: { fname: npath, vault },
          engine: this,
        });
      }
      noteNew = _.merge(noteNew, overrides || {});
      changed = (await this.writeNote(noteNew, { updateExisting })).data;
    }
    if (!createIfNew && !maybeNote) {
      error = new DendronError({ status: "no_note_found" });
    }
    await this.refreshNotesV2(changed);
    return {
      data: { note: noteNew, changed },
      error,
    };
  }

  async getConfig() {
    const cpath = DConfig.configPath(this.configRoot);
    const config = readYAML(cpath) as DendronConfig;
    return {
      error: null,
      data: config,
    };
  }

  async getSchema(id: string): Promise<RespV2<SchemaModulePropsV2>> {
    const ctx = "getSchema";
    const data = this.schemas[id];
    this.logger.info({ ctx, msg: "exit" });
    return {
      data,
      error: null,
    };
  }

  async info() {
    return {
      data: {
        version: NodeJSUtils.getVersionFromPkg(),
      },
      error: null,
    };
  }

  queryNotesSync({
    qs,
  }: {
    qs: string;
  }): ReturnType<DEngineClientV2["queryNotesSync"]> {
    const items = this.fuseEngine.queryNote({ qs });
    return {
      error: null,
      data: items.map((ent) => this.notes[ent.id]),
    };
  }

  async querySchema(queryString: string): Promise<SchemaQueryResp> {
    const ctx = "querySchema";

    let items: SchemaModulePropsV2[] = [];
    const results = await this.fuseEngine.querySchema({ qs: queryString });
    items = results.map((ent) => this.schemas[ent.id]);
    // if (queryString === "") {
    //   items = [this.schemas.root];
    // } else if (queryString === "*") {
    //   items = _.values(this.schemas);
    // } else {
    //   const results = this.schemaIndex.search(queryString);
    //   items = _.map(results, (resp) => this.schemas[resp.item.id]);
    // }
    this.logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: items,
    };
  }

  async queryNotes(
    opts: QueryNotesOpts
  ): ReturnType<DEngineClientV2["queryNotes"]> {
    const ctx = "Engine:queryNotes";
    const { qs, vault, createIfNew } = opts;
    let items = await this.fuseEngine.queryNote({ qs });
    let item = this.notes[items[0].id];
    if (createIfNew) {
      let noteNew: NotePropsV2;
      if (item?.fname === qs && item?.stub) {
        noteNew = item;
        noteNew.stub = false;
      } else {
        if (_.isUndefined(vault)) {
          return {
            error: new DendronError({ msg: "no vault specified" }),
            data: null as any,
          };
        }
        noteNew = NoteUtilsV2.create({ fname: qs, vault });
      }
      const changed = await this.writeNote(noteNew, { newNode: true });
      await this.refreshNotesV2(changed.data);
    }
    this.logger.info({ ctx, msg: "exit" });
    let notes = items.map((ent) => this.notes[ent.id]);
    if (!_.isUndefined(vault)) {
      notes = notes.filter((ent) =>
        VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
      );
    }
    return {
      error: null,
      data: notes,
    };
  }

  async sync() {
    throw Error("sync not implemented");
    return {} as any;
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    notes.forEach((ent: NoteChangeEntry) => {
      const { id } = ent.note;
      //const uri = NoteUtilsV2.getURI({ note: ent.note, wsRoot: this.wsRoot });
      if (ent.status === "delete") {
        delete this.notes[id];
        // this.history &&
        //   this.history.add({ source: "engine", action: "delete", uri });
      } else {
        if (ent.status === "create") {
          // this.history &&
          //   this.history.add({ source: "engine", action: "create", uri });
        }
        const links = ParserUtilsV2.findLinks({ note: ent.note, engine: this });
        ent.note.links = links;
        this.notes[id] = ent.note;
      }
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async renameNote(opts: RenameNoteOptsV2): Promise<RespV2<RenameNotePayload>> {
    try {
      const resp = await this.store.renameNote(opts);
      await this.refreshNotesV2(resp);
      return {
        error: null,
        data: resp,
      };
    } catch (err) {
      return {
        error: new DendronError({ payload: err }),
      };
    }
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    const out = this.store.updateNote(note, opts);
    await this.updateIndex("note");
    return out;
  }

  async updateIndex(mode: DNodeTypeV2) {
    if (mode === "schema") {
      this.fuseEngine.updateSchemaIndex(this.schemas);
    } else {
      this.fuseEngine.updateNotesIndex(this.notes);
    }
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
    const out = await this.store.updateSchema(schemaModule);
    await this.updateIndex("schema");
    return out;
  }

  async writeConfig(
    opts: ConfigWriteOpts
  ): ReturnType<DEngineV2["writeConfig"]> {
    const { configRoot } = this;
    const cpath = DConfig.configPath(configRoot);
    writeYAML(cpath, opts.config);
    return {
      error: null,
    };
  }

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const out = await this.store.writeNote(note, opts);
    await this.refreshNotesV2(out.data);
    return out;
  }

  async writeSchema(schema: SchemaModulePropsV2) {
    return this.store.writeSchema(schema);
  }
}

export const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV2.createV3({ vaults, wsRoot });
  return engine;
};
