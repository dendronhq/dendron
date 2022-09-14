import { IDataStore, RespV3 } from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";

/**
 * This implementation uses vscode's context.GlobalState to retrieve and store
 * KVP's. This is accessible on all vscode platforms (local and web) and it also
 * roams with the user across devices.
 */
export class VSCodeGlobalStateStore implements IDataStore<string, any> {
  private state;

  private keys: string[] = [];
  constructor(context: vscode.ExtensionContext) {
    this.state = context.globalState;
  }

  get(key: string): Promise<RespV3<any>> {
    return Promise.resolve({ data: this.state.get(key) });
  }

  find(_opts: any): Promise<RespV3<any[]>> {
    throw new Error("Method not implemented.");
  }

  async write(key: string, data: any): Promise<RespV3<string>> {
    // this.state.

    if (!_.find(this.keys, (value) => value === key)) {
      this.keys.push(key);
      this.state.setKeysForSync(this.keys);
    }

    await this.state.update(key, data);

    return Promise.resolve({ data: key });
  }

  async delete(key: string): Promise<RespV3<string>> {
    await this.state.update(key, undefined);

    return Promise.resolve({ data: key });
  }
}
