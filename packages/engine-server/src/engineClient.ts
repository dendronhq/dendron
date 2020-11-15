import {
  DendronError,
  DEngineClientV2,
  DEngineDeleteSchemaRespV2,
  DEngineInitRespV2,
  DLink,
  DNodePropsV2,
  DVault,
  EngineDeleteNoteResp,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ERROR_CODES,
  GetNoteOptsV2,
  GetNotePayloadV2,
  NoteChangeEntry,
  NotePropsDictV2,
  NotePropsV2,
  QueryNotesOpts,
  RenameNoteOptsV2,
  RenameNotePayload,
  RespV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaQueryResp,
  SchemaUtilsV2,
  WriteNoteResp,
} from "@dendronhq/common-all";
import { DendronAPI } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { FuseEngine } from "./fuseEngine";
import { getPortFilePath } from "./utils";

type DendronEngineClientOpts = {
  vaults: string[];
  ws: string;
};
export class DendronEngineClient implements DEngineClientV2 {
  public notes: NotePropsDictV2;
  public schemas: SchemaModuleDictV2;
  public vaults: string[];
  public links: DLink[];
  public ws: string;
  public fuseEngine: FuseEngine;
  public api: DendronAPI;
  public vaultsv3: DVault[];

  static create({
    port,
    vaults,
    ws,
  }: { port: number | string } & DendronEngineClientOpts) {
    const api = new DendronAPI({
      endpoint: `http://localhost:${port}`,
      apiPath: "api",
    });
    return new DendronEngineClient({ api, vaults, ws });
  }

  static getPort({ wsRoot }: { wsRoot: string }): number {
    const portFile = getPortFilePath({ wsRoot });
    if (!fs.pathExistsSync(portFile)) {
      throw new DendronError({ msg: "no port file" });
    }
    return _.toInteger(_.trim(fs.readFileSync(portFile, { encoding: "utf8" })));
  }

  constructor({
    api,
    vaults,
    ws,
  }: {
    api: DendronAPI;
    vaults: string[];
    ws: string;
  }) {
    this.api = api;
    this.notes = {};
    this.schemas = {};
    this.links = [];
    this.fuseEngine = new FuseEngine({});
    this.vaults = vaults;
    this.vaultsv3 = vaults.map((ent) => ({ fsPath: ent }));
    this.ws = ws;
  }

  /**
   * Load all nodes
   */
  async init(): Promise<DEngineInitRespV2> {
    const resp = await this.api.workspaceInit({
      uri: this.ws,
      config: { vaults: this.vaults },
    });
    if (resp.error && resp.error.code !== ERROR_CODES.MINOR) {
      return {
        error: resp.error,
        data: { notes: {}, schemas: {} },
      };
    }
    if (!resp.data) {
      throw new DendronError({ msg: "no data" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    await this.fuseEngine.updateNotesIndex(notes);
    await this.fuseEngine.updateSchemaIndex(schemas);
    return {
      error: resp.error,
      data: { notes, schemas },
    };
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<EngineDeleteNoteResp> {
    const ws = this.ws;
    const resp = await this.api.engineDelete({ id, opts, ws });
    if (!resp.data) {
      throw new DendronError({ msg: "no data" });
    }
    delete this.notes[id];
    await this.refreshNotes(
      _.map(
        _.filter(resp.data, (ent) => ent.status !== "delete"),
        (ent) => ent.note
      )
    );
    return {
      error: null,
      data: resp.data,
    };
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<DEngineDeleteSchemaRespV2> {
    const ws = this.ws;
    const resp = await this.api.schemaDelete({ id, opts, ws });
    delete this.schemas[id];
    if (!resp?.data?.notes || !resp?.data?.schemas) {
      throw new DendronError({ msg: "bad delete operation" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    this.fuseEngine.updateNotesIndex(notes);
    this.fuseEngine.updateSchemaIndex(schemas);
    return {
      error: null,
      data: resp.data,
    };
  }

  async getNoteByPath(opts: GetNoteOptsV2): Promise<RespV2<GetNotePayloadV2>> {
    const resp = await this.api.engineGetNoteByPath({
      ...opts,
      ws: this.ws,
    });
    if (!_.isUndefined(resp.data)) {
      await this.refreshNotes(_.map(resp.data.changed, (ent) => ent.note));
    }
    return resp;
  }

  async queryNote({ qs }: { qs: string }): Promise<NotePropsV2[]> {
    return await this.fuseEngine.queryNote({ qs });
  }

  async queryNotes(opts: QueryNotesOpts) {
    const items = await this.queryNote({ qs: opts.qs });
    return {
      data: items,
      error: null,
    };
  }

  async buildNotes() {}

  queryNotesSync({ qs }: { qs: string }) {
    const items = this.fuseEngine.queryNote({ qs });
    return {
      error: null,
      data: items,
    };
  }

  async refreshNotes(notes: NotePropsV2[]) {
    notes.forEach((node: DNodePropsV2) => {
      const { id } = node;
      this.notes[id] = node;
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    notes.forEach((ent: NoteChangeEntry) => {
      const { id } = ent.note;
      if (ent.status === "delete") {
        delete this.notes[id];
      } else {
        this.notes[id] = ent.note;
      }
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async refreshSchemas(smods: SchemaModulePropsV2[]) {
    smods.forEach((smod) => {
      const id = SchemaUtilsV2.getModuleRoot(smod).id;
      this.schemas[id] = smod;
    });
  }

  async renameNote(opts: RenameNoteOptsV2): Promise<RespV2<RenameNotePayload>> {
    const resp = await this.api.engineRenameNote({ ...opts, ws: this.ws });
    await this.refreshNotesV2(resp.data as NoteChangeEntry[]);
    return resp;
  }

  async sync(): Promise<DEngineInitRespV2> {
    const resp = await this.api.workspaceSync({ ws: this.ws });
    if (!resp.data) {
      throw new DendronError({ msg: "no data" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    await this.fuseEngine.updateNotesIndex(notes);
    await this.fuseEngine.updateSchemaIndex(schemas);
    return {
      error: resp.error,
      data: { notes, schemas },
    };
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    await this.api.engineUpdateNote({ ws: this.ws, note, opts });
    const maybeNote = this.notes[note.id];
    if (maybeNote) {
      note = { ...maybeNote, ...note };
    }
    await this.refreshNotes([note]);
    return;
  }

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const resp = await this.api.engineWrite({
      node: note,
      opts,
      ws: this.ws,
    });
    const changed = resp.data;
    await this.refreshNotesV2(changed);
    return resp;
  }

  // ~~~ schemas
  async getSchema(_qs: string): Promise<RespV2<SchemaModulePropsV2>> {
    throw Error("not implemetned");
  }

  async querySchema(qs: string): Promise<SchemaQueryResp> {
    const out = await this.api.schemaQuery({ qs, ws: this.ws });
    return _.defaults(out, { data: [] });
  }

  async updateSchema(schema: SchemaModulePropsV2): Promise<void> {
    await this.api.schemaUpdate({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }

  async writeSchema(schema: SchemaModulePropsV2): Promise<void> {
    await this.api.schemaWrite({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }
}
