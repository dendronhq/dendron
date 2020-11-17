import {
  DVault,
  genUUID,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";

type CreateNoteOpts = {
  vault: DVault;
  fname: string;
  body?: string;
  props?: Omit<NotePropsV2, "vault|fname|body">;
  genRandomId?: boolean;
};

export class NoteTestUtilsV3 {
  static createNote = async (opts: CreateNoteOpts) => {
    const { fname, vault, props, body, genRandomId } = opts;
    /**
     * Make sure snapshots stay consistent
     */
    const defaultOpts = {
      created: "1",
      updated: "1",
      id: genRandomId ? genUUID() : fname,
    };

    const note = NoteUtilsV2.create({
      ...defaultOpts,
      ...props,
      fname,
      vault,
      body,
    });
    await note2File(note, vault.fsPath);
    return note;
  };
}
