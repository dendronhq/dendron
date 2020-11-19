import {
  DendronError,
  DEngineDeleteSchemaPayloadV2,
  DEngineQuery,
  DNodePropsV2,
  EngineDeleteNotePayload,
  EngineDeleteOptsV2,
  EngineQueryNoteResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNoteOptsV2,
  GetNotePayloadV2,
  NotePropsDictV2,
  NotePropsV2,
  RenameNoteOptsV2,
  RenameNotePayload,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  WriteNoteResp,
} from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger } from "./logger";

const L = createLogger("api");

// === Types

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
  data: null | any | any[];
  error: null | DendronError;
}

interface IAPIOpts {
  endpoint: string;
  apiPath: string;
  _request: any;
  logger: any;
  statusHandlers: any;
  onAuth: (opts: IRequestArgs) => Promise<any>;
  onBuildHeaders: ({}: IRequestArgs) => Promise<any>;
  onError: ({}: {
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

interface IStatusHandler {
  resp: any;
}

type APIPayload<T = any> = {
  error: DendronError | null;
  data?: T;
};

// === Utilities

const APIError = DendronError;

const STATUS_HANDLERS = {
  401: {
    isErr: true,
    handler: ({ resp }: IStatusHandler) =>
      new APIError({ status: "not_authorized_error", code: resp.statusCode }),
  },
  404: {
    isErr: true,
    handler: ({ resp }: IStatusHandler) =>
      new APIError({ code: resp.statusCode, status: "does_not_exist_error" }),
  },
  502: {
    isErr: true,
    handler: ({ resp }: IStatusHandler) =>
      new APIError({ code: resp.statusCode, status: "unknown_error" }),
  },
};

// --- Requests
export type WorkspaceInitRequest = {
  uri: string;
  config: {
    vaults: string[];
  };
};
export type WorkspaceSyncRequest = WorkspaceRequest;

type WorkspaceRequest = { ws: string };

export type EngineQueryRequest = DEngineQuery & { ws: string };
export type EngineGetNoteByPathRequest = GetNoteOptsV2 & { ws: string };
export type EngineRenameNoteRequest = RenameNoteOptsV2 & { ws: string };
export type EngineUpdateNoteRequest = { ws: string } & {
  note: NotePropsV2;
  opts?: EngineUpdateNodesOptsV2;
};
export type EngineWriteRequest = {
  node: DNodePropsV2;
  opts?: EngineWriteOptsV2;
} & { ws: string };
export type EngineDeleteRequest = {
  id: string;
  opts?: EngineDeleteOptsV2;
} & { ws: string };

export type NoteQueryRequest = {
  qs: string;
} & Partial<WorkspaceRequest>;

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
  schema: SchemaModulePropsV2;
} & WorkspaceRequest;

export type SchemaUpdateRequest = SchemaWriteRequest;

// --- Payload
export type InitializePayload = APIPayload<{
  notes: NotePropsDictV2;
  schemas: SchemaModuleDictV2;
}>;

export type WorkspaceSyncPayload = InitializePayload;

export type EngineQueryPayload = APIPayload<DNodePropsV2[]>;
export type EngineGetNoteByPathPayload = APIPayload<GetNotePayloadV2>;
export type EngineRenameNotePayload = APIPayload<RenameNotePayload>;
export type EngineUpdateNotePayload = APIPayload<void>;
export type EngineDeletePayload = APIPayload<EngineDeleteNotePayload>;

export type SchemaDeletePayload = APIPayload<DEngineDeleteSchemaPayloadV2>;
export type SchemaReadPayload = APIPayload<SchemaModulePropsV2>;
export type SchemaQueryPayload = APIPayload<SchemaModulePropsV2[]>;
export type SchemaWritePayload = APIPayload<void>;
export type SchemaUpdatePayload = APIPayload<void>;

// === Base

export abstract class API {
  public opts: IAPIOpts;

  constructor(opts: IAPIConstructor) {
    opts = _.defaults(opts, {
      // _request: request,
      logger: L,
      statusHandlers: {},
      onAuth: async ({ headers }: IRequestArgs): Promise<any> => headers,
      onBuildHeaders: ({ headers }: IRequestArgs): Promise<any> => headers,
      onError: (_args: any) => {
        // console.log(args);
      },
    });
    if (!opts._request) {
      opts._request = require("request-promise");
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
    return _request[method](
      requestParams,
      async (err: any, resp: any, respBody: any) => {
        const { statusHandlers, onError } = this.opts;
        let foundError: boolean = false;
        // tslint:disable-next-line: no-shadowed-variable
        let respHandler = ({ resp }: IStatusHandler) => {
          const out = resp;
          return out;
        };

        // check if we have a handler based on return code
        if (
          _.has(_.defaults(statusHandlers, STATUS_HANDLERS), resp.statusCode)
        ) {
          const { statusCode } = resp;
          this._log({
            ctx: "post-request",
            msg: "use statusHandler",
            statusCode,
          });
          const { isErr, handler } = statusHandlers[resp.statusCode];
          respHandler = handler;
          if (isErr) {
            foundError = true;
          }
        }

        // log error if we have on
        if (foundError) {
          this._log({ ctx: "post-request-foundError", err });
          onError({
            headers,
            qs,
            path,
            method,
            err,
            body: respBody,
            resp,
          });
        }

        // trigger handler
        this._log({ ctx: "post-request-exit", resp, respHandler }, "debug");
        return respHandler({ resp });
      }
    );
  }

  async _makeRequest<T extends IAPIPayload>(
    args: IDoRequestArgs,
    paylaodData?: T["data"]
  ): Promise<T> {
    let payload = this._createPayload(paylaodData) as T;
    try {
      const resp = await this._doRequest(args);
      const { error, data } = resp;
      payload.data = data;
      payload.error = error;
    } catch (err) {
      payload.error = err;
    }
    return payload;
  }
}

// === DendronAPI

export class DendronAPI extends API {
  static instance: DendronAPI;

  async workspaceInit(req: WorkspaceInitRequest): Promise<InitializePayload> {
    const resp = await this._makeRequest({
      path: "workspace/initialize",
      method: "post",
      body: {
        ...req,
      },
    });
    return resp;
  }

  async workspaceList(): Promise<InitializePayload> {
    const resp = await this._makeRequest({
      path: "workspace/all",
      method: "get",
    });
    return this._createPayload(resp);
  }

  async workspaceSync(req: WorkspaceSyncRequest): Promise<InitializePayload> {
    const resp = await this._makeRequest({
      path: "workspace/sync",
      method: "post",
      body: req,
    });
    return resp;
  }

  async engineDelete(req: EngineDeleteRequest): Promise<EngineDeletePayload> {
    const resp = await this._makeRequest({
      path: "note/delete",
      method: "post",
      body: req,
    });
    return resp;
  }

  async engineGetNoteByPath(
    req: EngineGetNoteByPathRequest
  ): Promise<EngineGetNoteByPathPayload> {
    const resp = await this._makeRequest({
      path: "note/getByPath",
      method: "post",
      body: req,
    });
    return resp;
  }

  // async engineQuery(req: EngineQueryRequest): Promise<EngineQueryPayload> {
  //   const resp = await this._makeRequest({
  //     path: "note/query",
  //     method: "post",
  //     body: req,
  //   });
  //   return resp;
  // }

  async engineRenameNote(
    req: EngineRenameNoteRequest
  ): Promise<EngineRenameNotePayload> {
    const resp = await this._makeRequest({
      path: "note/rename",
      method: "post",
      body: req,
    });
    return resp;
  }

  async engineUpdateNote(
    req: EngineUpdateNoteRequest
  ): Promise<EngineUpdateNotePayload> {
    const resp = await this._makeRequest({
      path: "note/update",
      method: "post",
      body: req,
    });
    return resp;
  }

  async engineWrite(req: EngineWriteRequest): Promise<WriteNoteResp> {
    const resp = await this._makeRequest({
      path: "note/write",
      method: "post",
      body: req,
    });
    return resp;
  }

  async noteQuery(req: NoteQueryRequest): Promise<EngineQueryNoteResp> {
    const resp = await this._makeRequest({
      path: "note/query",
      method: "get",
      qs: req,
    });
    return resp;
  }

  async schemaDelete(req: SchemaDeleteRequest): Promise<SchemaDeletePayload> {
    const resp = await this._makeRequest({
      path: "schema/delete",
      method: "post",
      body: req,
    });
    return resp;
  }

  async schemaRead(req: SchemaReadRequest): Promise<SchemaReadPayload> {
    const resp = await this._makeRequest({
      path: "schema/get",
      method: "get",
      qs: req,
    });
    return resp;
  }

  async schemaQuery(req: SchemaQueryRequest): Promise<SchemaQueryPayload> {
    const resp = await this._makeRequest({
      path: "schema/query",
      method: "post",
      body: req,
    });
    return resp;
  }

  async schemaWrite(req: SchemaWriteRequest): Promise<SchemaWritePayload> {
    const resp = await this._makeRequest({
      path: "schema/write",
      method: "post",
      body: req,
    });
    return resp;
  }

  async schemaUpdate(req: SchemaUpdateRequest): Promise<SchemaUpdatePayload> {
    const resp = await this._makeRequest({
      path: "schema/update",
      method: "post",
      body: req,
    });
    return resp;
  }
}
