import axios, { AxiosInstance } from "axios";
import _ from "lodash";
import * as querystring from "qs";
import {
  BulkWriteNotesOpts,
  ConfigGetPayload,
  ConfigWriteOpts,
  DEngineDeleteSchemaPayload,
  DEngineQuery,
  DNodeProps,
  DVault,
  EngineDeleteNotePayload,
  EngineDeleteOptsV2,
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  NoteProps,
  RenameNoteOpts,
  RenameNotePayload,
  RespV2,
  SchemaModuleProps,
  WriteNoteResp,
} from ".";
import { ThemeTarget, ThemeType } from "./constants";
import { DendronCompositeError, DendronError, IDendronError } from "./error";
import {
  BulkWriteNoteResp,
  DEngineInitPayload,
  GetDecorationsPayload,
  GetNoteAnchorsPayload,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  NoteQueryResp,
  RenderNoteOpts,
  RenderNotePayload,
  VSRange,
} from "./types";

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

export type APIErrorType =
  | "does_not_exist_error"
  | "not_authorized_error"
  | "unknown_error"
  | "invalid_request_error";

export interface IAPIErrorArgs {
  type: APIErrorType;
  message?: string;
  code?: number;
}

interface IRequestArgs {
  headers: any;
}

interface IAPIPayload {
  data?: null | any | any[];
  error: null | DendronError | DendronCompositeError;
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

/**
 @deprecated - use RespV2 instead
  */
type APIPayload<T = any> = {
  error: IDendronError | null;
  data?: T;
};

// --- Requests
export type WorkspaceInitRequest = {
  uri: string;
  config: {
    vaults: DVault[];
  };
};
export type WorkspaceSyncRequest = WorkspaceRequest;

export type WorkspaceRequest = { ws: string };

export type EngineQueryRequest = DEngineQuery & { ws: string };
export type EngineRenameNoteRequest = RenameNoteOpts & { ws: string };
export type EngineUpdateNoteRequest = { ws: string } & {
  note: NoteProps;
  opts?: EngineUpdateNodesOptsV2;
};
export type EngineWriteRequest = {
  node: DNodeProps;
  opts?: EngineWriteOptsV2;
} & { ws: string };
export type EngineDeleteRequest = {
  id: string;
  opts?: EngineDeleteOptsV2;
} & { ws: string };
export type EngineBulkAddRequest = {
  opts: BulkWriteNotesOpts;
} & { ws: string };

export type EngineInfoRequest = WorkspaceRequest;
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
export type GetAnchorsRequest = { note: NoteProps };
export type GetLinksRequest = {
  note: NoteProps;
  /** regular is backlinks for wikilinks, hashtags, user tags etc., candidate is for backlink candidates */
  type: "regular" | "candidate";
} & WorkspaceRequest;

export type SchemaDeleteRequest = {
  id: string;
  opts?: EngineDeleteOptsV2;
} & Partial<WorkspaceRequest>;
export type SchemaReadRequest = {
  id: string;
} & Partial<WorkspaceRequest>;
export type SchemaQueryRequest = {
  qs: string;
} & Partial<WorkspaceRequest>;
export type SchemaWriteRequest = {
  schema: SchemaModuleProps;
} & WorkspaceRequest;

export type SchemaUpdateRequest = SchemaWriteRequest;

export type AssetGetRequest = { fpath: string } & WorkspaceRequest;

export type AssetGetThemeRequest = {
  themeTarget: ThemeTarget;
  themeType: ThemeType;
} & WorkspaceRequest;

// --- Payload
export type InitializePayload = APIPayload<DEngineInitPayload>;

export type WorkspaceSyncPayload = InitializePayload;
export type WorkspaceListPayload = APIPayload<{ workspaces: string[] }>;

export type EngineQueryPayload = APIPayload<DNodeProps[]>;
export type EngineRenameNotePayload = APIPayload<RenameNotePayload>;
export type EngineUpdateNotePayload = APIPayload<NoteProps>;
export type EngineDeletePayload = APIPayload<EngineDeleteNotePayload>;

export type SchemaDeletePayload = APIPayload<DEngineDeleteSchemaPayload>;
export type SchemaReadPayload = APIPayload<SchemaModuleProps>;
export type SchemaQueryPayload = APIPayload<SchemaModuleProps[]>;
export type SchemaWritePayload = APIPayload<void>;
export type SchemaUpdatePayload = APIPayload<void>;

export class APIUtils {
  static genUrlWithQS({ url, params }: { url: string; params: any }) {
    const str = querystring.stringify(params);
    return url + `?${str}`;
  }

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
      error: null,
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

  configGet(req: WorkspaceRequest): Promise<APIPayload<ConfigGetPayload>> {
    return this._makeRequest({
      path: "config/get",
      method: "get",
      qs: req,
    });
  }

  configWrite(req: ConfigWriteOpts & WorkspaceRequest): Promise<RespV2<void>> {
    return this._makeRequest({
      path: "config/write",
      method: "post",
      body: req,
    });
  }

  workspaceInit(req: WorkspaceInitRequest): Promise<InitializePayload> {
    return this._makeRequest({
      path: "workspace/initialize",
      method: "post",
      body: {
        ...req,
      },
    });
  }

  workspaceList(): Promise<WorkspaceListPayload> {
    return this._makeRequest({
      path: "workspace/all",
      method: "get",
    });
  }

  workspaceSync(req: WorkspaceSyncRequest): Promise<InitializePayload> {
    return this._makeRequest({
      path: "workspace/sync",
      method: "post",
      body: req,
    });
  }

  engineBulkAdd(req: EngineBulkAddRequest): Promise<BulkWriteNoteResp> {
    return this._makeRequest({
      path: "note/bulkAdd",
      method: "post",
      body: req,
    });
  }

  engineDelete(req: EngineDeleteRequest): Promise<EngineDeletePayload> {
    return this._makeRequest({
      path: "note/delete",
      method: "post",
      body: req,
    });
  }

  engineInfo(): Promise<RespV2<EngineInfoResp>> {
    return this._makeRequest({
      path: "note/info",
      method: "get",
    });
  }

  engineRenameNote(
    req: EngineRenameNoteRequest
  ): Promise<EngineRenameNotePayload> {
    return this._makeRequest({
      path: "note/rename",
      method: "post",
      body: req,
    });
  }

  engineUpdateNote(
    req: EngineUpdateNoteRequest
  ): Promise<EngineUpdateNotePayload> {
    return this._makeRequest({
      path: "note/update",
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

  noteQuery(req: NoteQueryRequest): Promise<NoteQueryResp> {
    return this._makeRequest({
      path: "note/query",
      method: "get",
      qs: req,
    });
  }

  noteRender(req: APIRequest<RenderNoteOpts>) {
    return this._makeRequest<{
      data: RenderNotePayload;
      error: null | DendronError;
    }>({
      path: "note/render",
      method: "post",
      body: req,
    });
  }

  getNoteBlocks(req: GetNoteBlocksRequest): Promise<GetNoteBlocksPayload> {
    return this._makeRequest({
      path: "note/blocks",
      method: "get",
      qs: req,
    });
  }

  getDecorations(req: GetDecorationsRequest): Promise<GetDecorationsPayload> {
    return this._makeRequest({
      path: "note/decorations",
      method: "post",
      body: req,
    });
  }

  getLinks(req: GetLinksRequest): Promise<GetNoteLinksPayload> {
    return this._makeRequest({
      path: "note/links",
      method: "post",
      body: req,
    });
  }

  getAnchors(req: GetAnchorsRequest): Promise<GetNoteAnchorsPayload> {
    return this._makeRequest({
      path: "note/anchors",
      method: "post",
      body: req,
    });
  }

  schemaDelete(req: SchemaDeleteRequest): Promise<SchemaDeletePayload> {
    return this._makeRequest({
      path: "schema/delete",
      method: "post",
      body: req,
    });
  }

  schemaRead(req: SchemaReadRequest): Promise<SchemaReadPayload> {
    return this._makeRequest({
      path: "schema/get",
      method: "get",
      qs: req,
    });
  }

  schemaQuery(req: SchemaQueryRequest): Promise<SchemaQueryPayload> {
    return this._makeRequest({
      path: "schema/query",
      method: "post",
      body: req,
    });
  }

  schemaWrite(req: SchemaWriteRequest): Promise<SchemaWritePayload> {
    return this._makeRequest({
      path: "schema/write",
      method: "post",
      body: req,
    });
  }

  schemaUpdate(req: SchemaUpdateRequest): Promise<SchemaUpdatePayload> {
    return this._makeRequest({
      path: "schema/update",
      method: "post",
      body: req,
    });
  }
}

export const DendronApiV2 = DendronAPI;
