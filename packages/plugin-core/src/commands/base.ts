import { DendronError } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
import { Logger } from "../logger";

export type CodeCommandConstructor = {
  key: string;
  new (): CodeCommandInstance;
};
export type CodeCommandInstance = {
  run: (opts?: any) => Promise<void>;
};

export abstract class BaseCommand<TOpts, TOut = any, TInput = any> {
  public L: DLogger;

  constructor(_name?: string) {
    this.L = Logger;
  }

  static showInput = window.showInputBox;

  async gatherInputs(_opts?: TOpts): Promise<TInput | undefined> {
    return {} as any;
  }

  abstract enrichInputs(inputs: TInput): Promise<TOpts | undefined>;

  abstract execute(opts: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  async sanityCheck(): Promise<undefined | string | "cancel"> {
    return;
  }

  async run(args?: Partial<TOpts>): Promise<TOut | undefined> {
    // @ts-ignore
    const ctx = `${this.__proto__.constructor.name}:run`;
    try {
      const out = await this.sanityCheck();
      if (out === "cancel") {
        return;
      }
      if (!_.isUndefined(out) && out !== "cancel") {
        window.showErrorMessage(out);
        return;
      }

      // @ts-ignore
      const inputs = await this.gatherInputs(args);
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
      Logger.error({ ctx, err: new DendronError({ payload: err }) });
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
