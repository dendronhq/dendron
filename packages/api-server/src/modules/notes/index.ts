import {
  DendronError,
  EngineDeletePayload,
  EngineDeleteRequest,
  EngineInfoResp,
  EngineRenameNotePayload,
  EngineRenameNoteRequest,
  EngineUpdateNoteRequest,
  NoteQueryRequest,
  NoteQueryResp,
  RenderNoteOpts,
  RenderNotePayload,
  RespV2,
  UpdateNoteResp,
} from "@dendronhq/common-all";
import { NodeJSUtils } from "@dendronhq/common-server";
import { getLogger } from "../../core";
import { MemoryStore } from "../../store/memoryStore";
import { getWSEngine } from "../../utils";

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
    const engine = await getWSEngine({ ws });
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

  async render({
    ws,
    ...opts
  }: RenderNoteOpts & { ws: string }): Promise<RespV2<RenderNotePayload>> {
    const engine = await getWSEngine({ ws });
    const data = await engine.renderNote(opts);
    return data;
  }

  async query({ ws, ...opts }: NoteQueryRequest): Promise<NoteQueryResp> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const data = await engine.queryNotes({ ...opts, originalQS: opts.qs });
      return data;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: [],
      };
    }
  }

  async info(): Promise<RespV2<EngineInfoResp>> {
    const ctx = "NoteController:info";
    getLogger().info({ ctx, msg: "enter" });
    try {
      const version = NodeJSUtils.getVersionFromPkg();
      if (!version) {
        return {
          data: undefined,
          error: DendronError.createPlainError({
            message: "Unable to read the Dendron version",
          }),
        };
      }
      return {
        data: {
          version,
        },
        error: null,
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
    const engine = await getWSEngine({ ws });
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
  }: EngineUpdateNoteRequest): Promise<UpdateNoteResp> {
    const engine = await getWSEngine({ ws });
    try {
      return engine.updateNote(note, opts);
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
