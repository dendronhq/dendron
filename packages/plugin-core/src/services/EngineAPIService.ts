import {
  DendronAPI,
  DEngine,
  DEngineOpts,
  DEngineStore,
  DNodeData,
  EngineDeleteOpts,
  EngineGetResp,
  EngineQueryResp,
  IDNode,
  NodeWriteOpts,
  NoteDict,
  QueryMode,
  QueryOneOpts,
  QueryOpts,
  SchemaDict,
  UpdateNodesOpts,
} from "@dendronhq/common-all";
import path from "path";
import { Logger } from "../logger";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService implements DEngine {
  public notes: NoteDict;
  public schemas: SchemaDict;
  public props: Required<DEngineOpts>;
  public initialized: boolean;
  public store: DEngineStore;

  constructor(public api: DendronAPI) {
    this.notes = {};
    this.schemas = {};
    this.props = {} as any;
    this.initialized = false;
    this.store = {} as any;
  }

  /**
   * Load all nodes
   */
  async init(): Promise<void> {
    const ctx = "EngineAPIService:init";
    Logger.info({ ctx, msg: "enter" });
    const uri = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    const vaults =
      DendronWorkspace.workspaceFolders()?.map((ent) => ent.uri.fsPath) || [];
    const resp = await this.api.workspaceInit({ uri, config: { vaults } });
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
  ): Promise<EngineQueryResp<DNodeData>> {
    return {} as any;
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
