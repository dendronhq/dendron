import { DendronError } from "@dendronhq/common-all";
import {
  EngineDeletePayload,
  EngineDeleteRequest,
  EngineGetNoteByPathPayload,
  EngineGetNoteByPathRequest,
  EngineRenameNotePayload,
  EngineRenameNoteRequest,
  EngineUpdateNotePayload,
  EngineUpdateNoteRequest,
} from "@dendronhq/common-server";
import { getWS } from "../../utils";

export class NoteController {
  static singleton?: NoteController;

  static instance() {
    if (!NoteController.singleton) {
      NoteController.singleton = new NoteController();
    }
    return NoteController.singleton;
  }

  async delete({
    ws,
    id,
    opts,
  }: EngineDeleteRequest): Promise<EngineDeletePayload> {
    const engine = await getWS({ ws });
    try {
      const data = await engine.deleteNote(id, opts);
      return data;
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async getByPath({
    ws,
    npath,
    createIfNew,
  }: EngineGetNoteByPathRequest): Promise<EngineGetNoteByPathPayload> {
    const engine = await getWS({ ws });
    try {
      const data = await engine.getNoteByPath({ npath, createIfNew });
      return data;
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async rename({
    ws,
    ...opts
  }: EngineRenameNoteRequest): Promise<EngineRenameNotePayload> {
    const engine = await getWS({ ws });
    try {
      const data = await engine.renameNote(opts);
      return data;
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async update({
    ws,
    note,
    opts,
  }: EngineUpdateNoteRequest): Promise<EngineUpdateNotePayload> {
    const engine = await getWS({ ws });
    try {
      await engine.updateNote(note, opts);
      return { error: null };
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
