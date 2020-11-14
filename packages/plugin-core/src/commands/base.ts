import { DendronError } from "@dendronhq/common-all";
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

  async run(args?: Partial<TOpts>): Promise<TOut | undefined> {
    // @ts-ignore
    const ctx = `${this.__proto__.constructor.name}:run`;
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
        this.L.info({ ctx, msg: "pre-execute" });
        const resp = await this.execute({ ...opts, ...args });
        this.L.info({ ctx, msg: "post-execute" });
        this.showResponse(resp);
        return resp;
      }
      return;
    } catch (err) {
      Logger.error({ err: JSON.stringify(err) });
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
