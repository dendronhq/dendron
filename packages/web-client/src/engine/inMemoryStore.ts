import {
  DNode,
  NodeDict,
  NodeGetBatchResp,
  NodeStub,
  NodeStubDict,
  NodeType,
  Scope,
  toStub,
} from "../common/types";
import { IdDict, NodeStore } from "./engine";
export default class InMemoryStore implements NodeStore {
  private nodes: NodeDict = {};
  private ids: IdDict = {};
  async getBatch(
    scope: Scope,
    ids: string[],
    nodeType: NodeType
  ): Promise<NodeGetBatchResp> {
    const out: NodeDict | NodeStubDict = {};
    if (nodeType == "stub") {
      for (const id of ids) {
        out[id] = toStub(this.nodes[id]);
      }
    } else {
      for (const id of ids) {
        out[id] = this.nodes[id];
      }
    }
    return { item: out, nodeType: nodeType };
  }
  async query(scope: Scope, regex: RegExp): Promise<IdDict> {
    const out: IdDict = {};
    for (const row in this.ids) {
      if (regex.test(row)) {
        out[row] = this.ids[row];
      }
    }
    return out;
  }
  async writeBatch(scope: Scope, nodes: NodeDict): Promise<void> {
    this.nodes = { ...this.nodes, ...nodes };
    for (const node of Object.values(nodes)) {
      let current = node.id;
      const path = [
        nodes[current].data.schemaId + "=" + nodes[current].data.title,
      ];
      while (nodes[current].parent != null) {
        current = (nodes[current].parent as NodeStub).id;
        path.push;
        nodes[current].data.schemaId + "=" + nodes[current].data.title();
      }
      this.ids[path.reverse().join("/")] = node.id;
    }
  }
}
