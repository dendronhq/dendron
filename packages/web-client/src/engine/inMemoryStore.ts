import { NodeStore, IdDict } from "./engine";
import { NodeStubDict, Scope, NodeDict, NodeType, NodeGetBatchResp, NodeStub, Node, toStub } from "../common/types";
export default class InMemoryStore implements NodeStore {
  private nodes: NodeDict = {};
  private ids: IdDict = {};
  async getBatch(scope: Scope, ids: string[], nodeType: NodeType): Promise<NodeGetBatchResp> {
    let out: NodeDict | NodeStubDict = {}
    if (nodeType == "stub") {
      for(let id of ids) { out[id] = toStub(this.nodes[id]); }
    } else {
      for(let id of ids) { out[id] = this.nodes[id]; }
    }
    return { item: out, nodeType: nodeType }
  }
  async query(scope: Scope, regex: RegExp): Promise<IdDict> {
    let out: IdDict = {};
    for (let row in this.ids) {
      if (regex.test(row)) {
        out[row] = this.ids[row];
      }
    }
    return out;
  }
  async writeBatch(scope: Scope, nodes: NodeDict): Promise<void> {
    this.nodes = {...this.nodes, ...nodes}
    for (let node of Object.values(nodes)) {
      let current = node.id;
      let path = [nodes[current].data.schemaId + "=" + nodes[current].data.title];
      while (nodes[current].parent != null) {
        current = (nodes[current].parent as NodeStub).id;
        path.push(nodes[current].data.schemaId + "=" + nodes[current].data.title);
      }
      this.ids[path.reverse().join('/')] = node.id;
    }
  }
}