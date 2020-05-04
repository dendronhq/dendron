import { Scope, DendronEngine, NodeType, DataType, NodeQueryResp, Node, NodeDict, NodeGetResp, NodeStubDict, NodeGetBatchResp } from "../common/types";
import Engine from "./engine";
import InMemoryStore from "./inMemoryStore";

export default class localAPI implements DendronEngine {
  public engine: Engine;
  constructor() {
    this.engine = new Engine(new InMemoryStore());
  }
  async get (scope: Scope, id: string, nodeType: NodeType): Promise<NodeGetResp> {
    let response = await this.engine.storage.getBatch(scope, [id], nodeType)
    let x: any = { item: Object.values(response.item)[0], ...response }; // appease typechecker
    return x;
  }

  async getBatch (scope: Scope, ids: string[], nodeType: NodeType): Promise<NodeGetBatchResp> {
    return this.engine.storage.getBatch(scope, ids, nodeType);
  }

  async query (scope: Scope, queryString: string, nodeType: NodeType): Promise<NodeQueryResp> {
    return await this.engine.query(scope, queryString, nodeType);
  }

  async write (scope: Scope, node: Node): Promise<void> {
    let dict: NodeDict = {};
    dict[node.id] = node;
    this.engine.storage.writeBatch(scope, dict);
  }

  async writeBatch (scope: Scope, nodes: NodeDict): Promise<void> {
    this.engine.storage.writeBatch(scope, nodes);
  }
  
}