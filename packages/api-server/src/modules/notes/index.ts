import {
  DendronError,
  EngineDeletePayload,
  EngineDeleteRequest,
  EngineGetNoteByPathPayload,
  EngineGetNoteByPathRequest,
  EngineInfoResp,
  EngineRenameNotePayload,
  EngineRenameNoteRequest,
  EngineUpdateNotePayload,
  EngineUpdateNoteRequest,
  NoteQueryRequest,
  NoteQueryResp,
  RenderNoteOpts,
  RenderNotePayload,
  RespRequired,
  RespV2,
} from "@dendronhq/common-all";
import { NodeJSUtils } from "@dendronhq/common-server";
import { getLogger } from "../../core";
import { MemoryStore } from "../../store/memoryStore";
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
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async getByPath({
    ws,
    ...opts
  }: EngineGetNoteByPathRequest): Promise<EngineGetNoteByPathPayload> {
    const engine = await getWS({ ws });
    try {
      const data = await engine.getNoteByPath(opts);
      return data;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async render({
    ws,
    ...opts
  }: RenderNoteOpts & { ws: string }): Promise<RespV2<RenderNotePayload>> {
    const engine = await getWS({ ws });
    const data = await engine.renderNote(opts);
    return data;
  }

  async query({ ws, ...opts }: NoteQueryRequest): Promise<NoteQueryResp> {
    const engine = ws
      ? await getWS({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const data = await engine.queryNotes(opts);
      return data;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: [],
      };
    }
  }

  async info(): Promise<RespRequired<EngineInfoResp>> {
    const ctx = "NoteController:info";
    getLogger().info({ ctx, msg: "enter" });
    // const engine = await getWS({ ws });
    try {
      const version = NodeJSUtils.getVersionFromPkg();
      return {
        data: {
          version,
        },
        error: undefined,
      };
    } catch (err) {
      getLogger().error({ ctx, err });
      return {
        error: DendronError.createPlainError({
          payload: err,
          message: "unknown error",
        }),
        data: undefined,
      };
    }
  }

  async rename({
    ws,
    ...opts
  }: EngineRenameNoteRequest): Promise<EngineRenameNotePayload> {
    const engine = await getWS({ ws });
    const ctx = "NoteController:rename";
    try {
      getLogger().info({ ctx, msg: "enter" });
      const data = await engine.renameNote(opts);
      return data;
    } catch (err) {
      getLogger().error({ ctx, err });
      return {
        error: DendronError.createPlainError({
          payload: err,
          message: "unknown error",
        }),
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
      const data = await engine.updateNote(note, opts);
      return { error: null, data };
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
