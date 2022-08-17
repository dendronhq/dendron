import {
  BulkResp,
  BulkWriteNotesOpts,
  EngineDeleteNotePayload,
  EngineDeleteOpts,
  EngineWriteOptsV2,
  FindNoteOpts,
  genUUID,
  NoteChangeEntry,
  NoteMetadataStore,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  QueryNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RespV2,
  RespV3,
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

  findNotes(_opts: FindNoteOpts): Promise<NoteProps[]> {
    throw new Error("Not Implemented");
  }

  findNotesMeta(_opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    throw new Error("Not Implemented");
  }

  bulkWriteNotes(
    _opts: BulkWriteNotesOpts
  ): Promise<BulkResp<NoteChangeEntry[]>> {
    throw new Error("Method not implemented.");
  }
  writeNote(
    _note: NoteProps,
    _opts?: EngineWriteOptsV2 | undefined
  ): Promise<RespV2<NoteChangeEntry[]>> {
    throw new Error("Method not implemented.");
  }
  deleteNote(
    _id: string,
    _opts?: EngineDeleteOpts | undefined
  ): Promise<Required<RespV2<EngineDeleteNotePayload>>> {
    throw new Error("Method not implemented.");
  }
  renameNote(_opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
    throw new Error("Method not implemented.");
  }
  async queryNotes(_opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>> {
    // throw new Error("Method not implemented.");

    const resp = await this.store.get("foo");

    const data = resp.data as NoteProps;
    return Promise.resolve({
      data: [data],
      error: null,
    });
  }
}
