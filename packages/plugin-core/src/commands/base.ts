import { DendronError, isTSError } from "@dendronhq/common-all";
import { DLogger, getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { IDendronExtension } from "../dendronExtensionInterface";
import { IBaseCommand } from "../types";

export type CodeCommandConstructor = {
  new (extension: IDendronExtension): CodeCommandInstance;
};
export type CodeCommandInstance = {
  key: string;
  run: (opts?: any) => Promise<void>;
};

export type AnalyticProps = {
  props?: any;
};

/**
 * Base class for all Dendron Plugin Commands.
 *
 *
 * Generics:
 *   - TOpts: passed into {@link BaseCommand.execute}
 *   - TOut: returned by {@link BaseCommand.execute}
 *   - TGatherOutput: returned by {@link BaseCommand.gatherInputs}
 *   - TRunOpts: passed into {@link BaseCommand.run}
 */
// eslint-disable-next-line no-redeclare
export abstract class BaseCommand<
  TOpts,
  TOut = any,
  TGatherOutput = TOpts,
  TRunOpts = TOpts
> implements IBaseCommand<TOpts, TOut, TGatherOutput, TRunOpts>
{
  public L: DLogger;

  constructor(_name?: string) {
    this.L = Logger;
  }

  addAnalyticsPayload?(opts?: TOpts, out?: TOut): any;

  static showInput = window.showInputBox;

  abstract key: string;

  async gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined> {
    return {} as any;
  }

  abstract enrichInputs(inputs: TGatherOutput): Promise<TOpts | undefined>;

  abstract execute(opts?: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  /**
   * Basic error checking
   * @returns
   */
  async sanityCheck(_opts?: TOpts): Promise<undefined | string | "cancel"> {
    return;
  }

  async run(args?: Partial<TRunOpts>): Promise<TOut | undefined> {
    const ctx = `${this.key}:run`;
    const start = process.hrtime();
    let isError = false;
    let opts: TOpts | undefined;
    let resp: TOut | undefined;

    try {
      // TODO: Add sanity check failure to analytics payload.
      const out = await this.sanityCheck(opts);
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
    } catch (error: any) {
      let cerror: DendronError;

      if (error instanceof DendronError) {
        cerror = error;
      } else if (isTSError(error)) {
        cerror = new DendronError({
          message: `error while running command: ${error.message}`,
          innerError: error,
        });
      } else {
        cerror = new DendronError({
          message: `unknown error while running command`,
        });
      }

      Logger.error({
        ctx,
        error: cerror,
      });

      isError = true;
      return;
    } finally {
      const payload = this.addAnalyticsPayload
        ? await this.addAnalyticsPayload(opts, resp)
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
