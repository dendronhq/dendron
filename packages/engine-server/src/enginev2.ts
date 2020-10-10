import {
  DEngineMode,
  DEngineV2,
  DNodePropsV2,
  DNodeTypeV2,
  DStoreV2,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNotePayloadV2,
  GetNoteOptsV2,
  NotePropsV2,
  NoteUtilsV2,
  QueryOptsV2,
  RespV2,
  SchemaModulePropsV2,
  SchemaPropsV2,
  SchemaUtilsV2,
  WriteNoteResp,
  EngineQueryNoteResp,
  SchemaQueryResp,
  DEngineInitRespV2,
  DendronError,
} from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import Fuse from "fuse.js";
import _ from "lodash";

type DendronEngineOptsV2 = {
  vaults: string[];
  forceNew?: boolean;
  store?: any;
  mode?: DEngineMode;
  logger?: DLogger;
};
type DendronEnginePropsV2 = Required<DendronEngineOptsV2>;

function createFuse<T>(
  initList: T[],
  opts: Fuse.IFuseOptions<any> & {
    exactMatch: boolean;
    preset: "schema" | "note";
  }
) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title", "fname", "basename"],
    useExtendedSearch: true,
  };
  if (opts.preset === "schema") {
    options.keys = ["id", "title"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

export class DendronEngineV2 implements DEngineV2 {
  public vaults: string[];
  public store: DStoreV2;
  public notesIndex: Fuse<NotePropsV2>;
  public schemaIndex: Fuse<SchemaPropsV2>;
  protected props: DendronEnginePropsV2;
  public logger: DLogger;

  constructor(props: DendronEnginePropsV2) {
    this.vaults = props.vaults;
    this.store = props.store;
    this.notesIndex = createFuse<NotePropsV2>([], {
      exactMatch: props.mode === "exact",
      preset: "note",
    });
    this.schemaIndex = createFuse<SchemaPropsV2>([], {
      exactMatch: props.mode === "exact",
      preset: "schema",
    });
    this.logger = props.logger;
    this.props = props;
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
      const { notes, schemas } = await this.store.init();
      this.updateIndex("note");
      this.updateIndex("schema");
      return {
        error: null,
        data: { notes, schemas },
      };
    } catch (error) {
      return {
        error,
        data: {},
      };
    }
  }

  async deleteNote(id: string, opts?: EngineDeleteOptsV2) {
    try {
      const note = this.notes[id];
      const changed: NotePropsV2[] = [];
      const status = await this.store.deleteNote(id, opts);
      if (status === "removed") {
        await this.removeNoteFromIndex(note);
        if (note.parent) {
          changed.push(this.notes[note.parent]);
        }
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

  async deleteSchema(id: string, opts?: EngineDeleteOptsV2) {
    const smod = this.schemas[id];
    try {
      await this.store.deleteSchema(id, opts);
      await this.removeSchemaFromIndex(smod);
      return {
        data: undefined,
        error: null,
      };
    } catch (err) {
      return {
        data: undefined,
        error: err,
      };
    }
  }

  async getNoteByPath({
    npath,
    createIfNew,
  }: GetNoteOptsV2): Promise<RespV2<GetNotePayloadV2>> {
    const ctx = "getNoteByPath";
    this.logger.debug({ ctx, npath, createIfNew, msg: "enter" });
    const maybeNote = NoteUtilsV2.getNoteByFname(npath, this.notes);
    this.logger.debug({ ctx, maybeNote, msg: "post-query" });
    let noteNew: NotePropsV2 | undefined = maybeNote;
    let changed: NotePropsV2[] = [];
    let error = null;
    if ((!maybeNote || maybeNote.stub) && createIfNew) {
      this.logger.debug({ ctx, maybeNote, msg: "create-new" });
      if (maybeNote?.stub) {
        noteNew = maybeNote;
        delete noteNew.stub;
      } else {
        noteNew = NoteUtilsV2.create({ fname: npath });
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

  async querySchema(queryString: string): Promise<SchemaQueryResp> {
    const ctx = "querySchema";

    let items: SchemaModulePropsV2[] = [];
    if (queryString === "") {
      items = [this.schemas.root];
    } else if (queryString === "*") {
      items = _.values(this.schemas);
    } else {
      const results = this.schemaIndex.search(queryString);
      items = _.map(results, (resp) => this.schemas[resp.item.id]);
    }
    this.logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: items,
    };
  }

  async query(
    queryString: string,
    mode: DNodeTypeV2,
    opts?: QueryOptsV2
  ): Promise<EngineQueryNoteResp> {
    const ctx = "query";
    const cleanOpts = _.defaults(opts || {}, {
      fullNode: false,
      createIfNew: false,
      initialQuery: false,
      stub: false,
    });
    this.logger.info({ ctx, msg: "enter" });
    let items: DNodePropsV2[] = [];

    // ~~~ schema query
    if (mode === "schema") {
      throw Error("engine.query for schema is not supported");
      // if (queryString === "") {
      //   items = [this.schemas.root.root];
      // } else if (queryString === "*") {
      //   items = _.values(this.schemas).map((ent) => ent.root);
      // } else {
      //   const results = this.schemaIndex.search(queryString);
      //   items = _.map(results, (resp) => resp.item);
      // }
    } else {
      // ~~~ note query
      if (queryString === "") {
        items = [this.notes.root];
      } else if (queryString === "*") {
        items = _.values(this.notes);
      } else {
        const results = this.notesIndex.search(queryString);
        items = _.map(results, (resp) => resp.item);
      }
      if (cleanOpts.createIfNew) {
        let noteNew: NotePropsV2;
        if (items[0]?.fname === queryString && items[0]?.stub) {
          noteNew = items[0];
          noteNew.stub = false;
        } else {
          noteNew = NoteUtilsV2.create({ fname: queryString });
        }
        await this.writeNote(noteNew, { newNode: true });
      }
      if (cleanOpts.fullNode) {
        throw Error("not implemented");
      }
    }

    // ~~~ exit
    this.logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: items,
    };
  }

  async removeNoteFromIndex(note: NotePropsV2) {
    this.notesIndex.remove((doc: NotePropsV2) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === note.id;
    });
  }

  async removeSchemaFromIndex(smod: SchemaModulePropsV2) {
    this.schemaIndex.remove((doc: SchemaPropsV2) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === SchemaUtilsV2.getModuleRoot(smod).id;
    });
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    return this.store.updateNote(note, opts);
  }

  async updateIndex(mode: DNodeTypeV2) {
    if (mode === "schema") {
      this.schemaIndex.setCollection(
        _.map(_.values(this.schemas), (ent) => SchemaUtilsV2.getModuleRoot(ent))
      );
    } else {
      this.notesIndex.setCollection(_.values(this.notes));
    }
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
    return this.store.updateSchema(schemaModule);
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
