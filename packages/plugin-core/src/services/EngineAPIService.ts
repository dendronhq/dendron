import {
  DendronAPI,
  DEngine,
  DEngineOpts,
  DEngineStore,
  DNodeData,
  DNodeRawProps,
  EngineDeleteOpts,
  EngineGetResp,
  EngineQueryResp,
  IDNode,
  IDNodeType,
  NodeWriteOpts,
  NoteDict,
  QueryMode,
  QueryOneOpts,
  QueryOpts,
  SchemaDict,
  UpdateNodesOpts,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Logger } from "../logger";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService implements DEngine {
  public notes: NoteDict;
  public schemas: SchemaDict;
  public props: Required<DEngineOpts>;
  public initialized: boolean;
  public store: DEngineStore;
  public ws: string;
  public fullNodes: Set<string>;

  constructor(public api: DendronAPI) {
    this.notes = {};
    this.fullNodes = new Set();
    this.schemas = {};
    this.props = {} as any;
    this.initialized = false;
    this.store = {} as any;
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
    await this.refreshNodes(resp.data.notes, "note");
    Logger.info({ ctx, msg: "exit", resp });
    return;
  }

  async delete(
    id: string,
    mode: QueryMode,
    opts?: EngineDeleteOpts
  ): Promise<void> {
    return;
  }

  /**
   * Get node based on id
   * get(id: ...)
   */
  async get(
    id: string,
    mode: QueryMode,
    opts?: QueryOpts
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
  ): Promise<EngineQueryResp> {
    const ctx = "query";
    const resp = await this.api.engineQuery({
      mode,
      queryString,
      opts,
      ws: this.ws,
    });
    await this.refreshNodes(resp.data as DNodeRawProps[], mode);
    Logger.info({ ctx, msg: "exit", resp });
    return resp;
  }

  /**
   * Shortcut Function
   */
  async queryOne(
    queryString: string,
    mode: QueryMode,
    opts?: QueryOneOpts
  ): Promise<EngineGetResp<DNodeData>> {
    return {} as any;
  }
  async refreshNodes(
    nodes: DNodeRawProps[],
    mode: IDNodeType,
    opts?: { fullNode?: boolean }
  ) {
    if (_.isEmpty(nodes)) {
      return;
    }
    if (mode === "schema") {
      throw Error("not implemented schema refresh");
    } else {
      nodes.forEach((node: DNodeRawProps) => {
        const { id } = node;
        if (!_.has(this.notes, id)) {
          // add if not exist
          // TODO: nodes has both raw and full nodes
          // @ts-ignore
          this.notes[id] = node;
        } else {
          // exists, merge it
          _.merge(this.notes[id], node);
        }
        if (opts?.fullNode) {
          this.fullNodes.add(id);
        }
      });
    }
  }

  async write(node: IDNode<DNodeData>, opts?: NodeWriteOpts): Promise<void> {
    return {} as any;
  }

  /**
   * Update engine properties
   * @param opts
   */
  async updateProps(opts: Partial<DEngineOpts>): Promise<void> {
    return;
  }

  /**
   * Update node metadata
   * @param node
   */
  async updateNodes(nodes: IDNode[], opts: UpdateNodesOpts): Promise<void> {
    return;
  }
}
