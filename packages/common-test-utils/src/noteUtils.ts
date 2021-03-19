import {
  DVault,
  genUUID,
  NoteProps,
  NoteUtils,
  SchemaModulePropsV2,
  SchemaUtils,
} from "@dendronhq/common-all";
import {
  file2Note,
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
};

export type CreateSchemaOptsV4 = {
  vault: DVault;
  wsRoot: string;
  fname: string;
  noWrite?: boolean;
  modifier?: (schema: SchemaModulePropsV2) => SchemaModulePropsV2;
};

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

  static createNote = async (opts: CreateNoteOptsV4) => {
    const {
      fname,
      vault,
      props,
      body,
      genRandomId,
      noWrite,
      wsRoot,
    } = _.defaults(opts, { noWrite: false });
    /**
     * Make sure snapshots stay consistent
     */
    const defaultOpts = {
      created: "1",
      updated: "1",
      id: genRandomId ? genUUID() : fname,
    };

    const note = NoteUtils.create({
      ...defaultOpts,
      ...props,
      fname,
      vault,
      body,
    });
    if (!noWrite) {
      await note2File({ note, vault, wsRoot });
    }
    return note;
  };

  static async modifyNoteByPath(
    opts: { wsRoot: string; vault: DVault; fname: string },
    cb: (note: NoteProps) => NoteProps
  ) {
    const { fname, vault, wsRoot } = opts;
    const npath = path.join(vault2Path({ vault, wsRoot }), fname + ".md");
    const note = file2Note(npath, vault);
    const newNote = cb(note);
    return await note2File({ note: newNote, vault, wsRoot });
  }
}
