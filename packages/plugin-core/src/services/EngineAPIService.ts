import {
  APIUtils,
  DendronAPI,
  EngineWriteOptsV2,
  NoteProps,
  WriteNoteResp,
} from "@dendronhq/common-all";
import { DendronEngineClient, HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService extends DendronEngineClient {
  private _trustedWorkspace: boolean = true;

  get trustedWorkspace(): boolean {
    return this._trustedWorkspace;
  }
  set trustedWorkspace(value: boolean) {
    this._trustedWorkspace = value;
  }

  static createEngine({
    port,
    enableWorkspaceTrust,
  }: {
    port: number | string;
    enableWorkspaceTrust?: boolean | undefined;
  }) {
    const vaults = DendronWorkspace.instance().vaultsv4 || [];
    const ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    const history = HistoryService.instance();

    const api = new DendronAPI({
      endpoint: APIUtils.getLocalEndpoint(
        _.isString(port) ? parseInt(port, 10) : port
      ),
      apiPath: "api",
    });

    const newSvc = new EngineAPIService({ api, vaults, ws, history });
    if (enableWorkspaceTrust !== undefined) {
      newSvc._trustedWorkspace = enableWorkspaceTrust;
    }
    return newSvc;
  }

  /**
   * Override of write note for the VS Code Plugin Client - this client needs to
   * observe workspace trust settings and prevent hook code execution if the
   * workspace is not trusted.
   * @param note
   * @param opts
   * @returns
   */
  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    if (!this._trustedWorkspace) {
      if (!opts) {
        opts = { runHooks: false };
      } else {
        opts.runHooks = false;
      }
    }
    return super.writeNote(note, opts);
  }
}
