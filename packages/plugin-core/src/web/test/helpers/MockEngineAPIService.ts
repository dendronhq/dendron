import {
  BulkGetNoteMetaResp,
  BulkGetNoteResp,
  BulkWriteNotesResp,
  BulkWriteNotesOpts,
  DeleteNoteResp,
  EngineDeleteOpts,
  EngineWriteOptsV2,
  FindNoteOpts,
  genUUID,
  NoteMetadataStore,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  QueryNotesOpts,
  QueryNotesResp,
  RenameNoteOpts,
  RenameNoteResp,
  RespV3,
  WriteNoteResp,
  type ReducedDEngine,
} from "@dendronhq/common-all";

export class MockEngineAPIService implements ReducedDEngine {
  // private noteProps: NoteProps[];

  private store: NoteMetadataStore;

  constructor() {
    // this.noteProps = [];
    this.store = new NoteMetadataStore();
  }

  async init() {
    const vault = {
      name: "vault1",
      visibility: undefined,
      fsPath: "vault1",
      workspace: undefined,
      remote: undefined,
      userPermission: undefined,
      noAutoPush: undefined,
      sync: undefined,
      seed: undefined,
      selfContained: undefined,
      siteUrl: undefined,
      siteIndex: undefined,
    };

    const defaultOpts = {
      created: 1,
      updated: 1,
      id: genUUID(),
    };

    const note = NoteUtils.create({
      ...defaultOpts,
      // ...props,
      // custom,
      fname: "foo",
      vault,
      // body,
    });

    // const note = await NoteTestUtilsV4.createNote({
    //   fname: "foo",
    //   vault,
    //   wsRoot: "",
    // });

    this.store.write(note.id, note);
  }

  async getNote(id: string): Promise<RespV3<NoteProps>> {
    return this.store.get(id) as Promise<RespV3<NoteProps>>;
  }

  async getNoteMeta(id: string): Promise<RespV3<NotePropsMeta>> {
    return this.store.get(id);
  }

  bulkGetNotes(_ids: string[]): Promise<BulkGetNoteResp> {
    throw new Error("Not Implemented");
  }

  bulkGetNotesMeta(_ids: string[]): Promise<BulkGetNoteMetaResp> {
    throw new Error("Not Implemented");
  }

  findNotes(_opts: FindNoteOpts): Promise<NoteProps[]> {
    throw new Error("Not Implemented");
  }

  findNotesMeta(_opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    throw new Error("Not Implemented");
  }

  bulkWriteNotes(_opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp> {
    throw new Error("Method not implemented.");
  }
  writeNote(
    _note: NoteProps,
    _opts?: EngineWriteOptsV2 | undefined
  ): Promise<WriteNoteResp> {
    throw new Error("Method not implemented.");
  }
  deleteNote(
    _id: string,
    _opts?: EngineDeleteOpts | undefined
  ): Promise<DeleteNoteResp> {
    throw new Error("Method not implemented.");
  }
  renameNote(_opts: RenameNoteOpts): Promise<RenameNoteResp> {
    throw new Error("Method not implemented.");
  }
  async queryNotes(_opts: QueryNotesOpts): Promise<QueryNotesResp> {
    // throw new Error("Method not implemented.");

    const resp = await this.store.get("foo");

    const data = resp.data as NoteProps;
    return Promise.resolve({
      data: [data],
    });
  }
}
