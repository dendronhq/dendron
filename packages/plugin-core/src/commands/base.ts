import { DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
import { Logger } from "../logger";

export abstract class BaseCommand<TOpts, TOut = any, TInput = any> {
  public L: DLogger;

  constructor(_name?: string) {
    this.L = Logger;
  }

  static showInput = window.showInputBox;

  async gatherInputs(): Promise<TInput | undefined> {
    return {} as any;
  }

  abstract async enrichInputs(inputs: TInput): Promise<TOpts | undefined>;

  abstract async execute(opts: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  async sanityCheck(): Promise<undefined | string> {
    return;
  }

  async run(): Promise<TOut | undefined> {
    try {
      const out = await this.sanityCheck();
      if (!_.isUndefined(out)) {
        window.showErrorMessage(out);
        return;
      }

      const inputs = await this.gatherInputs();
      if (!_.isUndefined(inputs)) {
        const opts: TOpts | undefined = await this.enrichInputs(inputs);
        if (_.isUndefined(opts)) {
          return;
        }
        const resp = await this.execute(opts);
        this.showResponse(resp);
        return resp;
      }
      return;
    } catch (err) {
      Logger.error(err.message);
      return;
    }
  }
}

export abstract class BasicCommand<TOpts, TOut = any> extends BaseCommand<
  TOpts,
  TOut,
  TOpts | undefined
> {
  async enrichInputs(inputs: TOpts): Promise<TOpts> {
    return inputs;
  }
}
