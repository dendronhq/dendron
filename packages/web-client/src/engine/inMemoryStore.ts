import { NodeStore } from "./engine";
import { NodeStubDict } from "../common/types";
export default class InMemoryStore<TData> implements NodeStore<TData> {
  public data: NodeStubDict<TData> = {};
  query(regex: RegExp): NodeStubDict<TData> {
    let out: NodeStubDict<TData> = {};
    for (let row in this.data) {
      if (regex.test(row)) {
        out[row] = this.data[row];
      }
    }
    return out;
  }
  write(rows: NodeStubDict<TData>): boolean {
    this.data = {...this.data, ...rows}
    return true;
  }
}