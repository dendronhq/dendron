import { DendronError } from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import _ from "lodash";

const STORE: any = {};

export class MemoryStore {
  static _instance: MemoryStore;

  static instance(force?: boolean) {
    if (!MemoryStore._instance || force) {
      MemoryStore._instance = new MemoryStore();
    }
    return MemoryStore._instance;
  }

  static store = () => {
    return STORE;
  };

  async put(key: string, value: any) {
    STORE[key] = value;
  }

  getEngine(): DendronEngineV2 {
    const out = _.values(STORE)[0];
    if (!out) {
      throw new DendronError({ message: "STORE is empty" });
    }
    return out;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return STORE[key] as T;
  }

  async list(prefix: string): Promise<any> {
    const keys = _.filter(_.keys(STORE), (ent: string) =>
      ent.startsWith(prefix)
    );
    return _.pick(STORE, keys);
  }
}
