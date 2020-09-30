import {
  DendronAPI,
  DEngineOpts,
  DEngineV2,
  DNodeData,
  DNodePropsV2,
  EngineDeleteOpts,
  EngineGetResp,
  IDNode,
  IDNodeType,
  NodeWriteOpts,
  NotePropsDictV2,
  QueryMode,
  QueryOneOpts,
  QueryOpts,
  Resp,
  SchemaPropsDictV2,
  UpdateNodesOpts,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Logger } from "../logger";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService implements DEngineV2 {
  public notes: NotePropsDictV2;
  public schemas: SchemaPropsDictV2;
  // public schemas: SchemaDict;
  // public props: Required<DEngineOpts>;
  // public initialized: boolean;
  // public store: DEngineStore;
  public ws: string;
  // public fullNodes: Set<string>;

  constructor(public api: DendronAPI) {
    this.notes = {};
    this.schemas = {};
    // this.fullNodes = new Set();
    // this.props = {} as any;
    // this.initialized = false;
    // this.store = {} as any;
    this.ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
  }

  /**
   * Load all nodes
   */
  async init(): Promise<void> {
    const ctx = "EngineAPIService:init";
    Logger.info({ ctx, msg: "enter" });
    const vaults =
      DendronWorkspace.workspaceFolders()?.map((ent) => ent.uri.fsPath) || [];
    const resp = await this.api.workspaceInit({
      uri: this.ws,
      config: { vaults },
    });
    // TODO: initialize root nodes
    // TODO: initialize everything else
    await this.refreshNodes(resp.data.notes, "note");
    Logger.info({ ctx, msg: "exit", resp });
    return;
  }

  async delete(
    _id: string,
    _mode: QueryMode,
    _opts?: EngineDeleteOpts
  ): Promise<void> {
    return;
  }

  /**
   * Get node based on id
   * get(id: ...)
   */
  async get(
    _id: string,
    _mode: QueryMode,
    _opts?: QueryOpts
  ): Promise<EngineGetResp<DNodeData>> {
    return {} as any;
  }

  // getBatch: (scope: Scope, ids: string[]) => Promise<NodeGetBatchResp>;

  /**
   * Get node based on query
   * query(scope: {username: lukesernau}, queryString: "project", nodeType: note)
   * - []
   * - [Node(id: ..., title: project, children: [])]
   */
  async query(
    queryString: string,
    mode: QueryMode,
    opts?: QueryOpts
  ): Promise<Resp<DNodePropsV2[]>> {
    const ctx = "query";
    const resp = await this.api.engineQuery({
      mode,
      queryString,
      opts,
      ws: this.ws,
    });
    await this.refreshNodes(resp.data, mode);
    Logger.info({ ctx, msg: "exit", resp });
    return resp;
  }

  /**
   * Shortcut Function
   */
  async queryOne(
    _queryString: string,
    _mode: QueryMode,
    _opts?: QueryOneOpts
  ): Promise<EngineGetResp<DNodeData>> {
    return {} as any;
  }

  async buildNotes() {}

  async refreshNodes(nodes: DNodePropsV2[], mode: IDNodeType) {
    if (_.isEmpty(nodes)) {
      return;
    }
    if (mode === "schema") {
      throw Error("not implemented schema refresh");
    } else {
      nodes.forEach((node: DNodePropsV2) => {
        const { id } = node;
        if (!_.has(this.notes, id)) {
          this.notes[id] = node;
        } else {
          _.merge(this.notes[id], node);
        }
      });
    }
  }

  async write(_node: IDNode<DNodeData>, _opts?: NodeWriteOpts): Promise<void> {
    return {} as any;
  }

  /**
   * Update engine properties
   * @param opts
   */
  async updateProps(_opts: Partial<DEngineOpts>): Promise<void> {
    return;
  }

  /**
   * Update node metadata
   * @param node
   */
  // @ts-ignore
  async updateNodes(
    nodes: DNodePropsV2[],
    opts: UpdateNodesOpts
  ): Promise<void> {
    throw Error("not implemented");
  }
}
