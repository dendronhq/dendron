import { Storage } from "./engine";
import { Node, NodeDict } from "../common/types";
export default class InMemoryStore<TData> implements Storage<TData> {
  public data: NodeDict<TData> = {};
  query(regex: RegExp): NodeDict<TData> {
    let out: NodeDict<TData> = {}; 
    for (let row in this.data) {
      if (regex.test(row)) {
        out[row] = this.data[row];
      }
    }
    return out;
  }
  write(rows: NodeDict<any>): boolean {
    this.data = {...this.data, ...rows}
    return true;
  }
}