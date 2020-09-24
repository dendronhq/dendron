import _ from "lodash";

const STORE: any = {};

export class MemoryStore {
  static _instance: MemoryStore;

  static instance() {
    if (!MemoryStore._instance) {
      MemoryStore._instance = new MemoryStore();
    }
    return MemoryStore._instance;
  }

  async put(key: string, value: any) {
    STORE[key] = value;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return STORE[key] as T;
  }

  async list(prefix: string): Promise<any> {
    return _.filter(STORE, (ent: string) => ent.startsWith(prefix));
  }
}
