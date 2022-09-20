import {
  AppNames,
  CLIIdentifyProps,
  CLIProps,
  CONSTANTS,
  DendronError,
  env,
  genUUID,
  RespV2,
  RuntimeUtils,
  VSCodeIdentifyProps,
  VSCodeProps,
} from "@dendronhq/common-all";
import Analytics from "analytics-node";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import { getOS } from "./system";
import { createLogger, DLogger } from "./logger";

enum SiteEvents {
  PUBLISH_CLICKED = "sitePublishClick",
  SOURCE_INFO_ENTER = "sitePublishInfoEnter",
  CREATED = "siteCreate",
  UPDATE_START = "siteUpdateStart",
  UPDATE_STOP = "siteUpdateStop",
  VISIT_SITE = "siteVisit",
}

enum SubscriptionEvents {
  CREATED = "subscriptionCreated",
}

// === PROPS

export type UserEventProps = {
  tier: UserTier;
};

export type RevenueEventProps = {
  $quantity: number;
  $revenue: number;
  $price: number;
};

export type SiteEventProps = {
  isCustomDomain?: boolean;
  isFirstTime?: boolean;
  domain: string;
};

export type SiteUpdatedEventProps = {
  source: "hook";
  progress: "start" | "stop";
  status?: CompletionStatus;
};

export type SubscriptionEventProps = {
  tier: UserTier;
};

// === Types

enum CompletionStatus {
  OK = "ok",
}

enum UserTier {
  SEED = "seed",
}

export type SegmentClientOpts = {
  key?: string;
  forceNew?: boolean;
  cachePath?: string;
  /**
   * Workspace configuration disable analytics
   */
  disabledByWorkspace?: boolean;
};

export const SEGMENT_EVENTS = {
  SiteEvents,
  SubscriptionEvents,
};

type SegmentExtraArg = {
  context?: any;
};

export type SegmentContext = Partial<{
  app: Partial<{ name: string; version: string; build: string }>;
  os: Partial<{ name: string; version: string }>;
  userAgent: string;
}>;

export enum TelemetryStatus {
  /** The user set that telemetry should be disabled in the workspace config. */
  DISABLED_BY_WS_CONFIG = "disabled by ws config",
  /** The user set that telemetry should be disabled in VSCode settings. */
  DISABLED_BY_VSCODE_CONFIG = "disabled by vscode config",
  /** The user used the Disable Telemetry command to disable telemetry. */
  DISABLED_BY_COMMAND = "disabled by command",
  /** The user disabled telemetry using dendron-cli */
  DISABLED_BY_CLI_COMMAND = "disabled by cli command",
  /** The user disabled telemetry in configuration, but used the Enable Telemetry command to give permission. */
  ENABLED_BY_COMMAND = "enabled by command",
  /** The user allowed telemetry by configuration. */
  ENABLED_BY_CONFIG = "enabled by config",
  /** The user did not opt out of telemetry prior to 0.46.0 update */
  ENABLED_BY_MIGRATION = "enabled by migration",
  /** The user enabled telemetry using dendron-cli */
  ENABLED_BY_CLI_COMMAND = "enabled by cli command",
  /** The user used dendron-cli before setting telemetry with vscode or plugin */
  ENABLED_BY_CLI_DEFAULT = "enabled by cli default",
}

enum SegmentResidualFlushStatus {
  success,
  retryableError,
  nonRetryableError,
}

export type TelemetryConfig = {
  status: TelemetryStatus;
};

export type SegmentEventProps = {
  event: string;
  properties?: { [key: string]: any };
  context?: any;
  timestamp?: Date;
  integrations?: { [key: string]: any };
};

export class SegmentClient {
  public _segmentInstance: Analytics;
  private _anonymousId: string;
  private _hasOptedOut: boolean;
  private logger: DLogger;
  private _cachePath?: string;

  static _locked: boolean = true;
  static _singleton: undefined | SegmentClient;

  /**
   * This is used to _unlock_ Segment client.
   * Before this is called, calling {@link SegmentClient.instance()} will throw an error.
   * This is to prevent accidental instantiation during module load time, as this will globally affect
   * how clients report data.
   */
  static unlock() {
    this._locked = false;
  }

  static instance(opts?: SegmentClientOpts) {
    if (this._locked) {
      const message = `
        You are trying to instantiate Segment client before _activate.
        Please check that your code change isn't unexpectedly instantiating the Segment client
        during module load time.
      `;
      throw new DendronError({
        message,
        payload: {
          message,
        },
      });
    } else {
      if (_.isUndefined(this._singleton) || opts?.forceNew) {
        this._singleton = new SegmentClient(opts);
      }
      return this._singleton;
    }
  }

  /** Legacy: If exists, Dendron telemetry has been disabled. */
  static getDisableConfigPath() {
    return path.join(os.homedir(), CONSTANTS.DENDRON_NO_TELEMETRY);
  }

  /** May contain configuration for Dendron telemetry. */
  static getConfigPath() {
    return path.join(os.homedir(), CONSTANTS.DENDRON_TELEMETRY);
  }

  static readConfig(): TelemetryConfig | undefined {
    try {
      return fs.readJSONSync(this.getConfigPath());
    } catch {
      return undefined;
    }
  }

  static getStatus(): TelemetryStatus {
    // Legacy, this file would have been created if the user used the Dendron Disable command
    if (fs.existsSync(this.getDisableConfigPath()))
      return TelemetryStatus.DISABLED_BY_COMMAND;

    const config = this.readConfig();
    // This is actually ambiguous, could have been using the command or by default.
    if (_.isUndefined(config)) return TelemetryStatus.ENABLED_BY_CONFIG;

    return config.status;
  }

  static isDisabled(status?: TelemetryStatus) {
    if (_.isUndefined(status)) status = this.getStatus();
    switch (status) {
      case TelemetryStatus.DISABLED_BY_COMMAND:
      case TelemetryStatus.DISABLED_BY_CLI_COMMAND:
      case TelemetryStatus.DISABLED_BY_VSCODE_CONFIG:
      case TelemetryStatus.DISABLED_BY_WS_CONFIG:
        return true;
      default:
        return false;
    }
  }

  static isEnabled(status?: TelemetryStatus) {
    return !this.isDisabled(status);
  }

  static enable(
    why:
      | TelemetryStatus.ENABLED_BY_COMMAND
      | TelemetryStatus.ENABLED_BY_CLI_COMMAND
      | TelemetryStatus.ENABLED_BY_CLI_DEFAULT
      | TelemetryStatus.ENABLED_BY_CONFIG
      | TelemetryStatus.ENABLED_BY_MIGRATION
  ) {
    // try to remove the legacy disable, if it exists
    try {
      fs.removeSync(this.getDisableConfigPath());
    } catch {
      // expected, legacy disable config is missing.
    }
    fs.writeJSONSync(this.getConfigPath(), { status: why });
  }

  static disable(
    why:
      | TelemetryStatus.DISABLED_BY_COMMAND
      | TelemetryStatus.DISABLED_BY_CLI_COMMAND
      | TelemetryStatus.DISABLED_BY_VSCODE_CONFIG
      | TelemetryStatus.DISABLED_BY_WS_CONFIG
  ) {
    fs.writeJSONSync(this.getConfigPath(), { status: why });
  }

  constructor(_opts?: SegmentClientOpts) {
    const { key, disabledByWorkspace } = _.defaults(_opts, {
      key: env("SEGMENT_VSCODE_KEY"),
      disabledByWorkspace: false,
    });
    this.logger = createLogger("SegmentClient");
    this._segmentInstance = new Analytics(key);
    this._cachePath = _opts?.cachePath;

    if (!_opts?.cachePath) {
      this.logger.info(
        "No cache path for Segment specified. Failed event uploads will not be retried."
      );
    }

    const status = SegmentClient.getStatus();
    this.logger.info({ msg: `user telemetry setting: ${status}` });
    this._hasOptedOut = SegmentClient.isDisabled() || disabledByWorkspace;

    if (this.hasOptedOut) {
      this._anonymousId = "";
      return;
    }

    const uuidPath = path.join(os.homedir(), CONSTANTS.DENDRON_ID);
    this.logger.info({ msg: "telemetry initializing" });
    if (fs.existsSync(uuidPath)) {
      this.logger.info({ msg: "using existing id" });
      this._anonymousId = _.trim(
        fs.readFileSync(uuidPath, { encoding: "utf8" })
      );
    } else {
      this.logger.info({ msg: "creating new id" });
      this._anonymousId = genUUID();
      fs.writeFileSync(uuidPath, this._anonymousId);
    }
    this.logger.info({ msg: "anonymous id", anonymousId: this._anonymousId });
  }

  identifyAnonymous(props?: { [key: string]: any }, opts?: SegmentExtraArg) {
    this.identify(undefined, props, opts);
  }

  identify(
    id?: string,
    props?: { [key: string]: any },
    opts?: SegmentExtraArg
  ) {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    if (this._hasOptedOut || this._segmentInstance == null) {
      return;
    }
    try {
      const { context } = opts || {};
      const identifyOpts: any = {
        anonymousId: this._anonymousId,
        traits: props,
        context,
      };
      if (id) {
        identifyOpts.userId = id;
      }
      this._segmentInstance.identify(identifyOpts);
      this._segmentInstance.flush();
    } catch (ex) {
      this.logger.error(ex);
    }
  }

  /**
   * Track an event with Segment. If the event fails to upload for any reason,
   * it will be saved to a residual cache file, which will be retried at a later
   * point.
   * @param event
   * @param data
   * @param opts
   * @returns a Promise which resolves when either the event has been
   * successfully uploaded to Segment or has been written to the cache file. It
   * is not recommended to await this function for metrics tracking.
   */
  async track(opts: SegmentEventProps): Promise<void> {
    if (this._hasOptedOut || this._segmentInstance == null) {
      return;
    }
    const resp = await this.trackInternal(opts);

    if (resp.error && this._cachePath) {
      try {
        await this.writeToResidualCache(this._cachePath, {
          event: opts.event,
          properties: opts.properties,
          context: opts.context,
          timestamp: resp.data?.timestamp,
          integrations: opts.integrations,
        });
      } catch (err: any) {
        this.logger.error(
          new DendronError({
            message: "Failed to write to segment residual cache: " + err,
          })
        );
      }
    }
  }

  private async trackInternal({
    event,
    properties,
    context,
    timestamp,
    integrations,
  }: SegmentEventProps): Promise<RespV2<SegmentEventProps>> {
    return new Promise<RespV2<SegmentEventProps>>((resolve) => {
      if (!_.isUndefined(timestamp)) {
        timestamp ||= new Date(timestamp);
      }
      this._segmentInstance.track(
        {
          anonymousId: this._anonymousId,
          event,
          properties,
          timestamp,
          context,
          integrations,
        },
        (err: Error) => {
          if (err) {
            this.logger.info("Failed to send event " + event);
            let eventTime: Date;
            try {
              eventTime = new Date(
                JSON.parse((err as any).config.data).timestamp
              );
            } catch (err) {
              eventTime = new Date();
            }
            resolve({
              data: {
                event,
                properties,
                context,
                timestamp: eventTime,
                integrations,
              },
              error: new DendronError({
                message: "Failed to send event " + event,
                innerError: err,
              }),
            });
          }

          resolve({ error: null });
        }
      );
    });
  }

  /**
   * Writes a tracked data point to the residual cache file. If the file exceeds
   * 5Mb than the write will fail silently.
   * @param filename
   * @param data
   * @returns
   */
  async writeToResidualCache(filename: string, data: SegmentEventProps) {
    return new Promise<void>((resolve) => {
      // Stop writing if the file gets more than 5 MB.
      if (
        fs.pathExistsSync(filename) &&
        fs.statSync(filename).size / (1024 * 1024) > 5
      ) {
        return resolve();
      }
      const stream = fs.createWriteStream(filename, { flags: "as" });
      stream.write(JSON.stringify(data) + "\n");
      stream.on("finish", () => {
        resolve();
      });
      stream.end();
    });
  }

  /**
   * Tries to upload data in the residual cache file to Segment. A separate
   * attempt is made to upload each data point - if any fail due to a retryable
   * error (such as no network), then it is kept in the cache file for the next
   * iteration. Any successfully uploaded data points or data deemed as a
   * non-recoverable error (for example, invalid format) are removed.
   * @returns
   */
  async tryFlushResidualCache(): Promise<{
    successCount: number;
    nonRetryableErrorCount: number;
    retryableErrorCount: number;
  }> {
    this.logger.info("Attempting to flush residual segment data from file.");
    let successCount = 0;
    let nonRetryableErrorCount = 0;
    let retryableErrorCount = 0;

    if (!this._cachePath) {
      return {
        successCount,
        nonRetryableErrorCount,
        retryableErrorCount,
      };
    }

    const buff = await fs.readFile(this._cachePath, "utf-8");

    const promises: Promise<SegmentResidualFlushStatus>[] = [];

    // Filter blank or whitespace lines:
    const eventLines = buff
      .split(/\r?\n/)
      .filter((line) => line !== null && line.match(/^ *$/) === null);

    eventLines.forEach((line) => {
      const singleTry = new Promise<SegmentResidualFlushStatus>((resolve) => {
        try {
          const data = JSON.parse(line) as SegmentEventProps;
          if (data.event === undefined || data.properties === undefined) {
            resolve(SegmentResidualFlushStatus.nonRetryableError);
          }

          const promised = this.trackInternal({
            event: data.event,
            properties: data.properties,
            context: data.context,
            timestamp: data.timestamp,
          });

          promised
            .then((resp) => {
              resolve(
                resp.error
                  ? SegmentResidualFlushStatus.retryableError
                  : SegmentResidualFlushStatus.success
              );
            })
            .catch(() => {
              resolve(SegmentResidualFlushStatus.nonRetryableError);
            });
        } catch (err: any) {
          resolve(SegmentResidualFlushStatus.nonRetryableError);
        }
      });

      promises.push(singleTry);
    }, this);

    const result = await Promise.all(promises);

    const nonRetryIndex: number[] = [];

    result.forEach((value, index) => {
      switch (value) {
        case SegmentResidualFlushStatus.success:
          successCount += 1;
          nonRetryIndex.push(index);
          break;
        case SegmentResidualFlushStatus.nonRetryableError:
          nonRetryableErrorCount += 1;
          nonRetryIndex.push(index);
          break;
        case SegmentResidualFlushStatus.retryableError:
          retryableErrorCount += 1;
          break;
        default:
          break;
      }
    });

    await fs.writeFile(
      this._cachePath,
      eventLines
        .filter((_value, index) => !nonRetryIndex.includes(index))
        .join("\n")
    );

    const stats = {
      successCount,
      nonRetryableErrorCount,
      retryableErrorCount,
    };

    if (successCount > 0) {
      this.track({
        event: "Segment_Residual_Data_Recovered",
        properties: stats,
      });
    }

    return stats;
  }

  get hasOptedOut(): boolean {
    return this._hasOptedOut;
  }

  get anonymousId(): string {
    return this._anonymousId;
  }
}

export class SegmentUtils {
  private static _trackCommon({
    event,
    context,
    platformProps,
    properties,
    integrations,
    timestamp,
  }: SegmentEventProps & {
    platformProps: VSCodeProps | CLIProps;
  }) {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    const { type, ...rest } = platformProps;
    const _properties = {
      ...properties,
      ...SegmentUtils.getCommonProps(),
      userAgent: type,
      ...rest,
    };
    return SegmentClient.instance().track({
      event,
      properties: _properties,
      context,
      integrations,
      timestamp,
    });
  }

  /**
   * Async tracking. Do not await this method as track calls can take ~8s to finish
   */
  static async track(
    opts: SegmentEventProps & {
      platformProps: VSCodeProps | CLIProps;
    }
  ): Promise<void> {
    return this._trackCommon(opts);
  }

  /**
   * Sync tracking. NOTE that the downstream function must await this function in order for this to be synchronous
   * @param opts
   * @returns
   */
  static async trackSync(
    opts: SegmentEventProps & {
      platformProps: VSCodeProps | CLIProps;
    }
  ): Promise<void> {
    return this._trackCommon(opts);
  }

  static identify(identifyProps: VSCodeIdentifyProps | CLIIdentifyProps) {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    if (identifyProps.type === AppNames.CODE) {
      const { appVersion, userAgent, ...rest } = identifyProps;
      SegmentClient.instance().identifyAnonymous(
        {
          ...SegmentUtils.getCommonProps(),
          ...rest,
          os: getOS(),
        },
        {
          context: {
            app: {
              version: appVersion,
            },
            os: {
              name: getOS(),
            },
            userAgent,
          },
        }
      );
    }

    if (identifyProps.type === AppNames.CLI) {
      const { cliVersion } = identifyProps;
      SegmentClient.instance().identifyAnonymous(
        {
          ...SegmentUtils.getCommonProps(),
          cliVersion,
        },
        {
          context: {
            app: {
              name: "dendron-cli",
              version: cliVersion,
            },
            os: {
              name: getOS(),
            },
          },
        }
      );
    }
  }

  static getCommonProps() {
    return {
      arch: process.arch,
      nodeVersion: process.version,
    };
  }
}
