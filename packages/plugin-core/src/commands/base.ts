import { createLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";

export abstract class BaseCommand<TOpts, TOut = any, TInput = any> {
  public L: ReturnType<typeof createLogger>;

  constructor(name?: string) {
    this.L = createLogger(name || "Command");
  }

  static showInput = window.showInputBox;

  async gatherInputs(): Promise<TInput|undefined> {
    return {} as any;
  }

  async abstract enrichInputs(inputs: TInput): Promise<TOpts>;

  abstract async execute(opts: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  async run(): Promise<TOut|undefined> {
    const inputs = await this.gatherInputs();
    if (!_.isUndefined(inputs)) {
      const opts: TOpts = await this.enrichInputs(inputs);
      const resp = await this.execute(opts);
      this.showResponse(resp);
      return resp;
    }
    return;
  }
}

export abstract class BasicCommand<TOpts, TOut = any> extends BaseCommand<TOpts, TOut, TOpts> {
  async enrichInputs(inputs: TOpts): Promise<TOpts> {
    return inputs;
  }
}