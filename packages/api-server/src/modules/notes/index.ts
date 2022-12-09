import {
  DendronError,
  EngineInfoResp,
  EngineRenameNoteRequest,
  NoteQueryRequest,
  QueryNotesMetaResp,
  QueryNotesResp,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
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

  async render({
    ws,
    ...opts
  }: RenderNoteOpts & { ws: string }): Promise<RenderNoteResp> {
    const engine = await getWSEngine({ ws });
    const data = await engine.renderNote(opts);
    return data;
  }

  async query({ ws, ...opts }: NoteQueryRequest): Promise<QueryNotesResp> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    return engine.queryNotes(opts.opts);
  }

  async queryMeta({
    ws,
    ...opts
  }: NoteQueryRequest): Promise<QueryNotesMetaResp> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    return engine.queryNotesMeta(opts.opts);
  }

  async info(): Promise<EngineInfoResp> {
    const ctx = "NoteController:info";
    getLogger().info({ ctx, msg: "enter" });
    try {
      const version = NodeJSUtils.getVersionFromPkg();
      if (!version) {
        return {
          error: DendronError.createPlainError({
            message: "Unable to read the Dendron version",
          }),
        };
      }
      return {
        data: {
          version,
        },
      };
    } catch (err) {
      getLogger().error({ ctx, err });
      return {
        error: DendronError.createPlainError({
          payload: err,
          message: "unknown error",
        }),
      };
    }
  }

  async rename({
    ws,
    ...opts
  }: EngineRenameNoteRequest): Promise<RenameNoteResp> {
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
      };
    }
  }
}
