import { DendronError, getStage, isTSError } from "@dendronhq/common-all";
import { DLogger, getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { IBaseCommand } from "../types";
import { AnalyticsUtils } from "../utils/analytics";

export type CodeCommandConstructor = {
  new (extension: IDendronExtension): CodeCommandInstance;
  requireActiveWorkspace: boolean;
};
export type CodeCommandInstance = {
  key: string;
  run: (opts?: any) => Promise<void>;
};

export type AnalyticProps = {
  props?: any;
};

/** Anything other than `undefined` is an error and will stop the command. "cancel" will stop the command without displaying an error. */
export type SanityCheckResults = undefined | string | "cancel";

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

  /**
   * Does this command require an active workspace in order to function
   */
  static requireActiveWorkspace = false;

  abstract key: string;
  skipAnalytics?: boolean;

  async gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined> {
    return {} as any;
  }

  abstract enrichInputs(inputs: TGatherOutput): Promise<TOpts | undefined>;

  abstract execute(opts?: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  /** Check for errors and stop execution if needed, runs before `gatherInputs`. */
  async sanityCheck(_opts?: Partial<TRunOpts>): Promise<SanityCheckResults> {
    return;
  }

  protected mergeInputs(opts: TOpts, args?: Partial<TRunOpts>): TOpts {
    return { ...opts, ...args };
  }

  async run(args?: Partial<TRunOpts>): Promise<TOut | undefined> {
    const ctx = `${this.key}:run`;
    const start = process.hrtime();
    let isError = false;
    let opts: TOpts | undefined;
    let resp: TOut | undefined;

    let sanityCheckResp: SanityCheckResults;

    try {
      sanityCheckResp = await this.sanityCheck(args);
      if (sanityCheckResp === "cancel") {
        this.L.info({ ctx, msg: "sanity check cancelled" });
        return;
      }
      if (!_.isUndefined(sanityCheckResp) && sanityCheckResp !== "cancel") {
        window.showErrorMessage(sanityCheckResp);
        return;
      }

      // @ts-ignore
      const inputs = await this.gatherInputs(args);
      // if undefined, imply user cancel
      if (_.isUndefined(inputs)) {
        return;
      }
      opts = await this.enrichInputs(inputs);
      if (_.isUndefined(opts)) {
        return;
      }
      this.L.info({ ctx, msg: "pre-execute" });
      resp = await this.execute(this.mergeInputs(opts, args));
      this.L.info({ ctx, msg: "post-execute" });
      this.showResponse(resp);
      return resp;
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
      // During development only, rethrow the errors to make them easier to debug
      if (getStage() === "dev") {
        throw error;
      }
      return;
    } finally {
      const payload = this.addAnalyticsPayload
        ? await this.addAnalyticsPayload(opts, resp)
        : {};
      const sanityCheckResults = sanityCheckResp
        ? { sanityCheck: sanityCheckResp }
        : {};
      if (!this.skipAnalytics)
        AnalyticsUtils.track(this.key, {
          duration: getDurationMilliseconds(start),
          error: isError,
          ...payload,
          ...sanityCheckResults,
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

/** This command passes the output of `gatherOpts`/`enrichOpts` directly to `execute`.
 *
 * The regular command class tries to merge the inputs from `gatherOpts` and `enrichOpts` together, which
 * will break your code if you use any `TOpts` that is not a basic js object.
 *
 * This is especially useful for commands that accept input directly from VSCode, like {@link ShowPreviewCommand}
 */
export abstract class InputArgCommand<TOpts, TOut = any> extends BasicCommand<
  TOpts,
  TOut,
  TOpts
> {
  async gatherInputs(opts?: TOpts): Promise<TOpts | undefined> {
    // The cast and return is needed because if `opts` is `undefined` then `run` will just skip doing `execute`
    return opts || ({} as TOpts);
  }

  protected mergeInputs(opts: TOpts, _args?: Partial<TOpts>): TOpts {
    return opts;
  }
}
