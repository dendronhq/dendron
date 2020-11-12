import {
  DendronError,
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
  NotePropsV2,
  NoteUtilsV2,
  QueryNotesOpts,
  RenameNoteOptsV2,
  RenameNotePayload,
  RespV2,
  SchemaModulePropsV2,
  SchemaQueryResp,
  WriteNoteResp,
} from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { FileStorageV2 } from "./drivers/file/storev2";
import { FuseEngine } from "./fuseEngine";

type DendronEngineOptsV2 = {
  vaults: string[];
  vaultsv3?: DVault[];
  forceNew?: boolean;
  store?: any;
  mode?: DEngineMode;
  logger?: DLogger;
};
type DendronEnginePropsV2 = Required<Omit<DendronEngineOptsV2, "vaultsv3">> & {
  vaultsv3?: DVault[];
};

export class DendronEngineV2 implements DEngineV2 {
  public vaults: string[];
  public store: DStoreV2;
  protected props: DendronEnginePropsV2;
  public logger: DLogger;
  public fuseEngine: FuseEngine;
  public links: DLink[];
  public vaultsv3: DVault[];

  static _instance: DendronEngineV2 | undefined;

  constructor(props: DendronEnginePropsV2) {
    this.vaults = props.vaults;
    this.store = props.store;
    this.logger = props.logger;
    this.props = props;
    this.fuseEngine = new FuseEngine({});
    this.links = [];
    this.vaultsv3 = !_.isUndefined(props.vaultsv3)
      ? props.vaultsv3
      : this.vaults.map((ent) => ({ fsPath: ent }));
  }

  static create({ vaults }: { vaults: string[] }) {
    const LOGGER = createLogger();
    return new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({
        vaults,
        logger: LOGGER,
      }),
      mode: "fuzzy",
      logger: LOGGER,
    });
  }

  static createV3({ vaults }: { vaults: DVault[] }) {
    const LOGGER = createLogger();
    const _vaults = vaults.map((ent) => ent.fsPath);
    return new DendronEngineV2({
      vaults: _vaults,
      vaultsv3: vaults,
      forceNew: true,
      store: new FileStorageV2({
        vaults: _vaults,
        vaultsv3: vaults,
        logger: LOGGER,
      }),
      mode: "fuzzy",
      logger: LOGGER,
    });
  }

  static instance({ vaults }: { vaults: DVault[] }) {
    if (!DendronEngineV2._instance) {
      DendronEngineV2._instance = DendronEngineV2.createV3({ vaults });
    }
    return DendronEngineV2._instance;
  }

  get notes() {
    return this.store.notes;
  }
  get schemas() {
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

  async deleteNote(id: string, opts?: EngineDeleteOptsV2) {
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
  }: GetNoteOptsV2): Promise<RespV2<GetNotePayloadV2>> {
    const ctx = "getNoteByPath";
    this.logger.debug({ ctx, npath, createIfNew, msg: "enter" });
    const maybeNote = NoteUtilsV2.getNoteByFname(npath, this.notes);
    this.logger.debug({ ctx, maybeNote, msg: "post-query" });
    let noteNew: NotePropsV2 | undefined = maybeNote;
    let changed: NoteChangeEntry[] = [];
    let error = null;
    if ((!maybeNote || maybeNote.stub) && createIfNew) {
      this.logger.debug({ ctx, maybeNote, msg: "create-new" });
      if (maybeNote?.stub) {
        noteNew = maybeNote;
        delete noteNew.stub;
      } else {
        noteNew = NoteUtilsV2.createWithSchema({
          noteOpts: { fname: npath, vault },
          engine: this,
        });
      }
      changed = (await this.writeNote(noteNew, { newNode: true })).data;
    }
    if (!createIfNew && !maybeNote) {
      error = new DendronError({ status: "no_note_found" });
    }
    return {
      data: { note: noteNew, changed },
      error,
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

  queryNotesSync({ qs }: { qs: string }) {
    const items = this.fuseEngine.queryNote({ qs });
    return {
      error: null,
      data: items,
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

  async queryNotes(opts: QueryNotesOpts) {
    const ctx = "Engine:queryNotes";
    const { qs, vault, createIfNew } = opts;
    const items = await this.fuseEngine.queryNote({ qs });
    if (createIfNew) {
      let noteNew: NotePropsV2;
      if (items[0]?.fname === qs && items[0]?.stub) {
        noteNew = items[0];
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
      await this.writeNote(noteNew, { newNode: true });
    }
    this.logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: items,
    };
  }

  // async query(
  //   queryString: string,
  //   mode: DNodeTypeV2,
  //   opts?: QueryOptsV2
  // ): Promise<EngineQueryNoteResp> {
  //   const ctx = "Engine:query";
  //   const cleanOpts = _.defaults(opts || {}, {
  //     fullNode: false,
  //     createIfNew: false,
  //     initialQuery: false,
  //     stub: false,
  //   });
  //   this.logger.info({ ctx, msg: "enter" });
  //   let items: DNodePropsV2[] = [];

  //   // ~~~ schema query
  //   if (mode === "schema") {
  //     throw Error("engine.query for schema is not supported");
  //   } else {
  //     // ~~~ note query
  //     items = await this.fuseEngine.queryNote({ qs: queryString });
  //     // if (queryString === "") {
  //     //   items = [this.notes.root];
  //     // } else if (queryString === "*") {
  //     //   items = _.values(this.notes);
  //     // } else {
  //     //   const results = this.notesIndex.search(queryString);
  //     //   items = _.map(results, (resp) => resp.item);
  //     // }
  //     if (cleanOpts.createIfNew) {
  //       let noteNew: NotePropsV2;
  //       if (items[0]?.fname === queryString && items[0]?.stub) {
  //         noteNew = items[0];
  //         noteNew.stub = false;
  //       } else {
  //         noteNew = NoteUtilsV2.create({ fname: queryString });
  //       }
  //       await this.writeNote(noteNew, { newNode: true });
  //     }
  //     if (cleanOpts.fullNode) {
  //       throw Error("not implemented");
  //     }
  //   }

  //   // ~~~ exit
  //   this.logger.info({ ctx, msg: "exit" });
  //   return {
  //     error: null,
  //     data: items,
  //   };
  // }

  async sync() {
    throw Error("sync not implemented");
    return {} as any;
  }

  async renameNote(opts: RenameNoteOptsV2): Promise<RespV2<RenameNotePayload>> {
    const resp = await this.store.renameNote(opts);
    return {
      error: null,
      data: resp,
    };
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

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const out = await this.store.writeNote(note, opts);
    await this.updateIndex("note");
    return out;
  }

  async writeSchema(schema: SchemaModulePropsV2) {
    return this.store.writeSchema(schema);
  }
}
