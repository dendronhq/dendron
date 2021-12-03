import {
  DVault,
  genUUID,
  NoteProps,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  DNodePropsQuickInputV2,
  NotePropsDict,
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
  props?: Partial<Omit<NoteProps, "vault|fname|body">>;
  genRandomId?: boolean;
  noWrite?: boolean;
  custom?: any;
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

  async createForFNames(fnames: string[]): Promise<NoteProps[]> {
    const noteProps: NoteProps[] = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < fnames.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      noteProps.push(await this.createForFName(fnames[i]));
    }
    return noteProps;
  }

  toNotePropsDict(notes: NoteProps[]): NotePropsDict {
    const dict: NotePropsDict = {};

    for (const note of notes) {
      dict[note.id] = note;
    }

    return dict;
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
    const { fname, vault, props, body, genRandomId, noWrite, wsRoot, custom } =
      _.defaults(opts, { noWrite: false });
    /**
     * Make sure snapshots stay consistent
     */
    const defaultOpts = {
      created: 1,
      updated: 1,
      id: genRandomId ? genUUID() : fname,
    };

    const note = NoteUtils.create({
      ...defaultOpts,
      ...props,
      custom,
      fname,
      vault,
      body,
    });
    if (!noWrite) {
      await note2File({ note, vault, wsRoot });
    }
    return note;
  };

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
    const note = file2Note(npath, vault);
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
}
