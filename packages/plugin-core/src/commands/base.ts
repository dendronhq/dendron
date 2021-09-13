import { DendronError } from "@dendronhq/common-all";
import { DLogger, getDurationMilliseconds } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import { window } from "vscode";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";

export type CodeCommandConstructor = {
  new (): CodeCommandInstance;
};
export type CodeCommandInstance = {
  key: string;
  run: (opts?: any) => Promise<void>;
};

export type AnalyticProps = {
  props?: any;
};

export interface BaseCommand<
  TOpts,
  TOut = any,
  TGatherOutput = TOpts,
  TRunOpts = TOpts
> {
  /**
   * Optional method to add properties to the analytics payload
   * @param opts - Arguments passed to execute()
   * @param out - return value from execute()
   */
  addAnalyticsPayload?(opts?: TOpts, out?: TOut): any;
}

/**
 * Generics:
 *   - TOpts: passed into {@link BaseCommand.execute}
 *   - TGatherOutput: returned by {@link Basecommand.gatherInput}
 *   - TOut: returned by {@link BaseCommand.execute}
 *   - TRunOpts: returned by command
 */
// eslint-disable-next-line no-redeclare
export abstract class BaseCommand<
  TOpts,
  TOut = any,
  TGatherOutput = TOpts,
  TRunOpts = TOpts
> {
  public L: DLogger;

  constructor(_name?: string) {
    this.L = Logger;
  }

  static showInput = window.showInputBox;

  abstract key: string;

  async gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined> {
    return {} as any;
  }

  abstract enrichInputs(inputs: TGatherOutput): Promise<TOpts | undefined>;

  abstract execute(opts: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  /**
   * Basic error checking
   * @returns
   */
  async sanityCheck(): Promise<undefined | string | "cancel"> {
    return;
  }

  async run(args?: Partial<TRunOpts>): Promise<TOut | undefined> {
    const ctx = `${this.key}:run`;
    const start = process.hrtime();
    let isError = false;
    let opts: TOpts | undefined;
    let resp: TOut | undefined;

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
        opts = await this.enrichInputs(inputs);
        if (_.isUndefined(opts)) {
          return;
        }
        this.L.info({ ctx, msg: "pre-execute" });
        resp = await this.execute({ ...opts, ...args });
        this.L.info({ ctx, msg: "post-execute" });
        this.showResponse(resp);
        return resp;
      }
      return;
    } catch (error) {
      const cerror: DendronError =
        error instanceof DendronError
          ? error
          : new DendronError({
              message: `error running command: ${error.message}`,
              error,
            });
      Logger.error({
        ctx,
        error: cerror,
      });

      isError = true;
      return;
    } finally {
      const payload = this.addAnalyticsPayload
        ? this.addAnalyticsPayload(opts, resp)
        : {};

      AnalyticsUtils.track(this.key, {
        duration: getDurationMilliseconds(start),
        error: isError,
        ...payload,
      });
    }
  }
}

/**
 * Command with no enriched inputs
 */
export abstract class BasicCommand<
  TOpts,
  TOut = any,
  TRunOpts = TOpts
> extends BaseCommand<TOpts, TOut, TOpts, TRunOpts> {
  async enrichInputs(inputs: TOpts): Promise<TOpts> {
    return inputs;
  }
}
