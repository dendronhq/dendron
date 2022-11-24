import {
  DVault,
  genHash,
  genUUID,
  NoteProps,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  DNodePropsQuickInputV2,
  DEngineClient,
  EngineWriteOptsV2,
  SchemaTemplate,
  ErrorUtils,
} from "@dendronhq/common-all";
import {
  file2Note,
  file2Schema,
  note2File,
  resolvePath,
  schemaModuleProps2File,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";

export type CreateNoteOptsV4 = {
  vault: DVault;
  wsRoot: string;
  fname: string;
  body?: string;
  props?: Partial<Omit<NoteProps, "vault" | "fname" | "body" | "custom">>;
  id?: string;
  genRandomId?: boolean;
  noWrite?: boolean;
  custom?: any;
  stub?: boolean;
};

export type CreateNoteInputOpts = {
  label?: string;
} & CreateNoteOptsV4;

export type CreateSchemaOptsV4 = {
  vault: DVault;
  wsRoot: string;
  fname: string;
  noWrite?: boolean;
  modifier?: (schema: SchemaModuleProps) => SchemaModuleProps;
};

/**
 * Class for simplifying creation of multiple notes for tests by being
 * able to specify defaults upon construction.
 *
 * Example usage:
 * <pre>
 *    const noteFactory = TestNoteFactory.defaultUnitTestFactory();
 *
 *    const note = await noteFactory.createForFName("your-fname");
 * </pre>
 *
 * */
export class TestNoteFactory {
  static readonly DEFAULT_VAULT = { fsPath: "/tmp/ws/v1" };
  static readonly DEFAULT_WS_ROOT = "/tmp/ws";

  private readonly _defaults: Omit<CreateNoteOptsV4, "fname">;

  public static defaultUnitTestFactory() {
    return new TestNoteFactory({
      vault: this.DEFAULT_VAULT,
      noWrite: true,
      wsRoot: this.DEFAULT_WS_ROOT,
    });
  }

  constructor(defaults: Omit<CreateNoteOptsV4, "fname">) {
    this._defaults = {
      ...defaults,
    };
  }

  async createForFName(fname: string): Promise<NoteProps> {
    return NoteTestUtilsV4.createNote({
      fname,
      ...this._defaults,
    });
  }

  async createForFNameWithEngine(
    fname: string,
    props: Partial<NoteProps> & { engine: DEngineClient }
  ): Promise<NoteProps> {
    return NoteTestUtilsV4.createNoteWithEngine({
      fname,
      ...this._defaults,
      ...props,
    });
  }

  async createNoteInputWithFNames(
    fnames: string[]
  ): Promise<DNodePropsQuickInputV2[]> {
    return Promise.all(
      fnames.map((name) => this.createNoteInputWithFName(name))
    );
  }

  createNoteInputWithFName(fname: string): Promise<DNodePropsQuickInputV2> {
    return NoteTestUtilsV4.createNotePropsInput({
      fname,
      ...this._defaults,
    });
  }

  async createForFNames(fnames: string[]): Promise<NoteProps[]> {
    return Promise.all(fnames.map((name) => this.createForFName(name)));
  }
}

export class NoteTestUtilsV4 {
  static createSchema = async (opts: CreateSchemaOptsV4) => {
    const { fname, vault, noWrite, wsRoot } = _.defaults(opts, {
      noWrite: false,
    });

    let schema = SchemaUtils.createModuleProps({ fname, vault });
    if (opts.modifier) {
      schema = opts.modifier(schema);
    }
    if (!noWrite) {
      const vpath = resolvePath(vault.fsPath, wsRoot);
      await schemaModuleProps2File(schema, vpath, fname);
    }
    return schema;
  };

  /**
   * By default, create note with following properties:
   *  - created & updated = 1
   *  - id = note.fname
   *  - body = ""
   * @param opts
   * @returns
   */
  static createNote = async (opts: CreateNoteOptsV4) => {
    const {
      fname,
      vault,
      props,
      body,
      genRandomId,
      noWrite,
      wsRoot,
      custom,
      stub,
    } = _.defaults(opts, { noWrite: false });
    /**
     * Make sure snapshots stay consistent
     */
    let id = opts.id;

    if (!id) {
      id = genRandomId ? genUUID() : fname;
    }

    const defaultOpts = {
      created: 1,
      updated: 1,
      id,
    };

    const note = NoteUtils.create({
      ...defaultOpts,
      ...props,
      custom,
      fname,
      vault,
      body,
      stub,
    });

    if (!noWrite && !stub) {
      await note2File({ note, vault, wsRoot });
    }
    return note;
  };

  /** This is like `createNote`, except it will make sure the engine is updated with the note.
   *
   * Prefer this over `createNote` if you are creating a note when the engine is
   * already active. For example, when you are using `describeMultiWs` or
   * `describeSingleWs` where the engine is already active inside the block.
   *
   * Avoid using this to update an existing note, this may cause issues.
   */
  static async createNoteWithEngine(
    opts: Omit<CreateNoteOptsV4, "noWrite"> & { engine: DEngineClient } & {
      engineWriteNoteOverride?: EngineWriteOptsV2;
    }
  ) {
    const note = await this.createNote({ ...opts, noWrite: true });
    note.contentHash = genHash(note.body);
    await opts.engine.writeNote(note, opts.engineWriteNoteOverride);
    return note;
  }

  static async createNotePropsInput(
    opts: CreateNoteInputOpts
  ): Promise<DNodePropsQuickInputV2> {
    const noteProps = await this.createNote(opts);
    const props = {
      label: "default-label-val",
      ...opts,
      ...noteProps,
    };
    return {
      ...props,
    };
  }

  static async modifyNoteByPath(
    opts: { wsRoot: string; vault: DVault; fname: string },
    cb: (note: NoteProps) => NoteProps
  ) {
    const { fname, vault, wsRoot } = opts;
    const npath = path.join(vault2Path({ vault, wsRoot }), fname + ".md");
    const resp = file2Note(npath, vault);
    if (ErrorUtils.isErrorResp(resp)) {
      throw resp.error;
    }
    const note = resp.data;
    const newNote = cb(note);
    return note2File({ note: newNote, vault, wsRoot });
  }

  static async modifySchemaByPath(
    opts: { wsRoot: string; vault: DVault; fname: string },
    cb: (schema: SchemaModuleProps) => SchemaModuleProps
  ) {
    const { fname, vault, wsRoot } = opts;
    const vpath = vault2Path({ vault, wsRoot });
    const npath = path.join(vpath, fname + ".schema.yml");
    const schema = await file2Schema(npath, wsRoot);
    const newSchema = cb(schema);
    return schemaModuleProps2File(newSchema, vpath, fname);
  }

  /**
   * Setup schema that references template that may or may not lie in same vault
   */
  static setupSchemaCrossVault = (opts: {
    wsRoot: string;
    vault: DVault;
    template: SchemaTemplate;
  }) => {
    const { wsRoot, vault, template } = opts;
    return NoteTestUtilsV4.createSchema({
      fname: "food",
      wsRoot,
      vault,
      modifier: (schema) => {
        const schemas = [
          SchemaUtils.createFromSchemaOpts({
            id: "food",
            parent: "root",
            fname: "food",
            children: ["ch2"],
            vault,
          }),
          SchemaUtils.createFromSchemaRaw({
            id: "ch2",
            template,
            namespace: true,
            vault,
          }),
        ];
        schemas.map((s) => {
          schema.schemas[s.id] = s;
        });
        return schema;
      },
    });
  };
}
