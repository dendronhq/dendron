import {
  DNode,
  DataType,
  DendronEngine,
  EngineGetResp,
  EngineQueryResp,
  NodeDict,
  NodeGetBatchResp,
  NodeStubDict,
  NodeType,
  Scope,
} from "../common/types";

import Engine from "./engine";
import InMemoryStore from "./inMemoryStore";

export default class LocalAPI implements DendronEngine {
  public engine: Engine;
  constructor() {
    this.engine = new Engine(new InMemoryStore());
  }
  async get(
    scope: Scope,
    id: string,
    nodeType: NodeType
  ): Promise<EngineGetResp> {
    const response = await this.engine.storage.getBatch(scope, [id], nodeType);
    const x: any = { item: Object.values(response.item)[0], ...response }; // appease typechecker
    return x;
  }

  async getBatch(
    scope: Scope,
    ids: string[],
    nodeType: NodeType
  ): Promise<NodeGetBatchResp> {
    return this.engine.storage.getBatch(scope, ids, nodeType);
  }

  async query(
    scope: Scope,
    queryString: string,
    nodeType: NodeType
  ): Promise<EngineQueryResp> {
    return await this.engine.query(scope, queryString, nodeType);
  }

  async queryLocal(
    scope: Scope,
    queryString: string,
    nodeType: NodeType
  ): Promise<EngineQueryResp> {
    return await this.engine.query(scope, queryString, nodeType);
  }

  async write(scope: Scope, node: DNode): Promise<void> {
    const dict: NodeDict = {};
    dict[node.id] = node;
    this.engine.storage.writeBatch(scope, dict);
  }

  async writeBatch(scope: Scope, nodes: NodeDict): Promise<void> {
    this.engine.storage.writeBatch(scope, nodes);
  }
}
