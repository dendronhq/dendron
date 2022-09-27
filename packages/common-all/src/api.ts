import axios, { AxiosInstance } from "axios";
import _ from "lodash";
import * as querystring from "qs";
import {
  BulkWriteNotesOpts,
  DNodeProps,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineWriteOptsV2,
  RenameNoteOpts,
  SchemaModuleProps,
  WriteNoteResp,
} from ".";
import { ThemeTarget, ThemeType } from "./constants";
import { DendronCompositeError, DendronError } from "./error";
import {
  BulkWriteNotesResp,
  DeleteNoteResp,
  DeleteSchemaResp,
  DEngineInitResp,
  EngineSchemaWriteOpts,
  FindNotesResp,
  GetDecorationsResp,
  GetNoteBlocksResp,
  GetSchemaResp,
  IntermediateDendronConfig,
  QueryNotesResp,
  QuerySchemaResp,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
  RespV3,
  VSRange,
  WriteSchemaResp,
} from "./types";
import { DVault } from "./types/DVault";
import { FindNoteOpts } from "./types/FindNoteOpts";

// === Types

export type APIRequest<T> = {
  ws: string;
} & T;

export function createNoOpLogger() {
  const logMethod = (_msg: any) => {};
  return {
    level: "",
    debug: logMethod,
    info: logMethod,
    error: logMethod,
  };
}

interface IRequestArgs {
  headers: any;
}

export interface IAPIPayload {
  data: undefined | any | any[];
  error: undefined | DendronError | DendronCompositeError;
}

interface IAPIOpts {
  endpoint: string;
  apiPath: string;
  _request: AxiosInstance;
  logger: any;
  statusHandlers: any;
  onAuth: (opts: IRequestArgs) => Promise<any>;
  onBuildHeaders: (opts: IRequestArgs) => Promise<any>;
  onError: (opts: {
    err: DendronError;
    body: any;
    resp: any;
    headers: any;
    qs: any;
    path: string;
    method: string;
  }) => any;
}

type IAPIConstructor = {
  endpoint: string;
  apiPath: string;
} & Partial<IAPIOpts>;

interface IDoRequestArgs {
  path: string;
  auth?: boolean;
  qs?: any;
  body?: any;
  method?: "get" | "post";
  json?: boolean;
}

// --- Requests
export type WorkspaceInitRequest = {
  uri: string;
  config: {
    vaults: DVault[];
  };
};
export type WorkspaceSyncRequest = WorkspaceRequest;

export type WorkspaceRequest = { ws: string };

export type EngineRenameNoteRequest = RenameNoteOpts & { ws: string };
export type EngineWriteRequest = {
  node: DNodeProps;
  opts?: EngineWriteOptsV2;
} & { ws: string };
export type EngineDeleteRequest = {
  id: string;
  opts?: EngineDeleteOpts;
} & { ws: string };
export type EngineBulkAddRequest = {
  opts: BulkWriteNotesOpts;
} & { ws: string };

export type NoteQueryRequest = {
  qs: string;
  vault?: DVault;
} & Partial<WorkspaceRequest>;

export type GetNoteBlocksRequest = {
  id: string;
  filterByAnchorType?: "header" | "block";
} & WorkspaceRequest;

export type GetDecorationsRequest = {
  id: string;
  ranges: {
    range: VSRange;
    text: string;
  }[];
  text: string;
} & Partial<WorkspaceRequest>;

export type SchemaDeleteRequest = {
  id: string;
  opts?: EngineDeleteOpts;
} & Partial<WorkspaceRequest>;
export type SchemaReadRequest = {
  id: string;
} & Partial<WorkspaceRequest>;
export type SchemaQueryRequest = {
  qs: string;
} & Partial<WorkspaceRequest>;
export type SchemaWriteRequest = {
  schema: SchemaModuleProps;
  opts?: EngineSchemaWriteOpts;
} & WorkspaceRequest;

export type AssetGetRequest = { fpath: string } & WorkspaceRequest;

export type AssetGetThemeRequest = {
  themeTarget: ThemeTarget;
  themeType: ThemeType;
} & WorkspaceRequest;

export class APIUtils {
  /** Generate a localhost url to this API.
   *
   * Warning! In VSCode, the generated URL won't work if the user has a remote
   * workspace. You'll need to use `vscode.env.asExternalUri` to make it remote.
   */
  static getLocalEndpoint(port: number) {
    return `http://localhost:${port}`;
  }
}

// === Base

abstract class API {
  public opts: IAPIOpts;

  constructor(opts: IAPIConstructor) {
    opts = _.defaults(opts, {
      logger: createNoOpLogger(),
      statusHandlers: {},
      onAuth: async ({ headers }: IRequestArgs): Promise<any> => headers,
      onBuildHeaders: ({ headers }: IRequestArgs): Promise<any> => headers,
      onError: (_args: any) => {
        // console.log(args);
      },
    });
    if (!opts._request) {
      opts._request = axios.create({});
    }

    this.opts = opts as IAPIOpts;
  }

  _log(msg: any, lvl: "info" | "debug" | "error" | "fatal" = "info") {
    this.opts.logger[lvl](msg);
  }

  _createPayload(data: any) {
    return {
      data,
    };
  }

  async _doRequest({
    auth = false,
    qs = {},
    path,
    body = {},
    method = "get",
    json = true,
  }: IDoRequestArgs) {
    let headers = {};
    const { _request, onAuth, onBuildHeaders, endpoint, apiPath } = this.opts;
    if (auth) {
      headers = await onAuth({ headers });
    }
    headers = await onBuildHeaders({ headers });
    const requestParams = {
      url: [endpoint, apiPath, path].join("/"),
      qs,
      body,
      json,
      ...headers,
    };
    this._log({ ctx: "pre-request", requestParams }, "debug");
    const str = querystring.stringify(requestParams.qs);
    if (method === "get") {
      return _request.get(requestParams.url + `?${str}`, {
        headers,
      });
    } else {
      return _request.post(requestParams.url + `?${str}`, body, {
        headers,
      });
    }
  }

  async _makeRequest<T extends IAPIPayload>(
    args: IDoRequestArgs,
    payloadData?: T["data"]
  ): Promise<T> {
    const payload = this._createPayload(payloadData) as T;
    try {
      const resp = await this._doRequest(args);
      payload.data = resp.data.data;
      payload.error = resp.data.error;
    } catch (err: any) {
      this._log(payload.error, "error");
      // Log errors from express:
      payload.error =
        err?.response?.data?.error || // Corresponds to an expected error that we intentionally log in our code
        err?.response?.data || // Corresponds to an unexpected server error (HTTP 500) if a data payload was added
        err; // Corresponds to an axios (HTTP request) thrown error
    }
    if (payload.error) {
      this._log(payload.error, "error");
    }
    return payload;
  }

  async _makeRequestRaw(args: IDoRequestArgs) {
    try {
      const resp = await this._doRequest(args);
      if (resp.data.error) {
        return new DendronError({ ...resp.data.error });
      }
      return resp.data;
    } catch (err: any) {
      return new DendronError({ ...err.response.data.error });
    }
  }
}

// === DendronAPI

// eslint-disable-next-line camelcase
let _DendronAPI_INSTANCE: DendronAPI | undefined;

export class DendronAPI extends API {
  static getOrCreate(opts: IAPIConstructor) {
    if (!_.isUndefined(_DendronAPI_INSTANCE)) {
      return this.instance();
    }
    return new DendronAPI(opts);
  }

  static instance(): DendronAPI {
    if (_.isUndefined(_DendronAPI_INSTANCE)) {
      throw Error("no dendron api");
    }
    // eslint-disable-next-line camelcase
    return _DendronAPI_INSTANCE;
  }

  assetGet(req: AssetGetRequest): Promise<DendronError | Buffer> {
    return this._makeRequestRaw({
      path: "assets/",
      method: "get",
      qs: req,
    });
  }

  assetGetTheme(req: AssetGetThemeRequest): Promise<DendronError | Buffer> {
    return this._makeRequestRaw({
      path: "assets/theme",
      method: "get",
      qs: req,
    });
  }

  configGet(req: WorkspaceRequest): Promise<RespV3<IntermediateDendronConfig>> {
    return this._makeRequest({
      path: "config/get",
      method: "get",
      qs: req,
    });
  }

  workspaceInit(req: WorkspaceInitRequest): Promise<DEngineInitResp> {
    return this._makeRequest({
      path: "workspace/initialize",
      method: "post",
      body: {
        ...req,
      },
    });
  }

  workspaceSync(req: WorkspaceSyncRequest): Promise<DEngineInitResp> {
    return this._makeRequest({
      path: "workspace/sync",
      method: "post",
      body: req,
    });
  }

  engineBulkAdd(req: EngineBulkAddRequest): Promise<BulkWriteNotesResp> {
    return this._makeRequest({
      path: "note/bulkAdd",
      method: "post",
      body: req,
    });
  }

  engineDelete(req: EngineDeleteRequest): Promise<DeleteNoteResp> {
    return this._makeRequest({
      path: "note/delete",
      method: "post",
      body: req,
    });
  }

  engineInfo(): Promise<EngineInfoResp> {
    return this._makeRequest({
      path: "note/info",
      method: "get",
    });
  }

  engineRenameNote(req: EngineRenameNoteRequest): Promise<RenameNoteResp> {
    return this._makeRequest({
      path: "note/rename",
      method: "post",
      body: req,
    });
  }

  engineWrite(req: EngineWriteRequest): Promise<WriteNoteResp> {
    return this._makeRequest({
      path: "note/write",
      method: "post",
      body: req,
    });
  }

  noteFind(req: APIRequest<FindNoteOpts>): Promise<RespV3<FindNotesResp>> {
    return this._makeRequest({
      path: "note/find",
      method: "post",
      body: req,
    });
  }

  noteQuery(req: NoteQueryRequest): Promise<QueryNotesResp> {
    return this._makeRequest({
      path: "note/query",
      method: "get",
      qs: req,
    });
  }

  noteRender(req: APIRequest<RenderNoteOpts>): Promise<RenderNoteResp> {
    return this._makeRequest({
      path: "note/render",
      method: "post",
      body: req,
    });
  }

  getNoteBlocks(req: GetNoteBlocksRequest): Promise<GetNoteBlocksResp> {
    return this._makeRequest({
      path: "note/blocks",
      method: "get",
      qs: req,
    });
  }

  getDecorations(req: GetDecorationsRequest): Promise<GetDecorationsResp> {
    return this._makeRequest({
      path: "note/decorations",
      method: "post",
      body: req,
    });
  }

  schemaDelete(req: SchemaDeleteRequest): Promise<DeleteSchemaResp> {
    return this._makeRequest({
      path: "schema/delete",
      method: "post",
      body: req,
    });
  }

  schemaRead(req: SchemaReadRequest): Promise<GetSchemaResp> {
    return this._makeRequest({
      path: "schema/get",
      method: "get",
      qs: req,
    });
  }

  schemaQuery(req: SchemaQueryRequest): Promise<QuerySchemaResp> {
    return this._makeRequest({
      path: "schema/query",
      method: "post",
      body: req,
    });
  }

  schemaWrite(req: SchemaWriteRequest): Promise<WriteSchemaResp> {
    return this._makeRequest({
      path: "schema/write",
      method: "post",
      body: req,
    });
  }
}

export const DendronApiV2 = DendronAPI;
