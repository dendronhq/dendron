import { CONSTANTS, DendronError, env, genUUID } from "@dendronhq/common-all";
import Analytics from "analytics-node";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import { createLogger, DLogger } from "./logger";

import * as Sentry from "@sentry/node";

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
};

export const SEGMENT_EVENTS = {
  SiteEvents,
  SubscriptionEvents,
};

type SegmentExtraArg = {
  context?: any;
};

export enum TelemetryStatus {
  /** The user set that telemetry should be disabled in the workspace config. */
  DISABLED_BY_WS_CONFIG = "disabled by ws config",
  /** The user set that telemetry should be disabled in VSCode settings. */
  DISABLED_BY_VSCODE_CONFIG = "disabled by vscode config",
  /** The user used the Disable Telemetry command to disable telemetry. */
  DISABLED_BY_COMMAND = "disabled by command",
  /** The user disabled telemetry in configuration, but used the Enable Telemetry command to give permission. */
  ENABLED_BY_COMMAND = "enabled by command",
  /** The user allowed telemetry by configuration. */
  ENABLED_BY_CONFIG = "enabled by config",
  /** The user did not opt out of telemetry prior to 0.46.0 update */
  ENABLED_BY_MIGRATION = "enabled by migration",
}

export type TelemetryConfig = {
  status: TelemetryStatus;
};

export class SegmentClient {
  public _segmentInstance: Analytics;
  private _anonymousId: string;
  private _hasOptedOut: boolean;
  private logger: DLogger;

  static _singleton: undefined | SegmentClient;

  static instance(opts?: SegmentClientOpts) {
    if (_.isUndefined(this._singleton) || opts?.forceNew) {
      this._singleton = new SegmentClient(opts);
    }
    return this._singleton;
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

  static setByConfig(status?: TelemetryStatus) {
    if (_.isUndefined(status)) status = this.getStatus();
    switch (status) {
      case TelemetryStatus.DISABLED_BY_COMMAND:
      case TelemetryStatus.ENABLED_BY_COMMAND:
      case TelemetryStatus.ENABLED_BY_MIGRATION:
        return false;
      default:
        return true;
    }
  }

  static enable(
    why:
      | TelemetryStatus.ENABLED_BY_COMMAND
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
      | TelemetryStatus.DISABLED_BY_VSCODE_CONFIG
      | TelemetryStatus.DISABLED_BY_WS_CONFIG
  ) {
    fs.writeJSONSync(this.getConfigPath(), { status: why });
  }

  constructor(_opts?: SegmentClientOpts) {
    const key = env("SEGMENT_VSCODE_KEY");
    this.logger = createLogger("SegmentClient");
    this._segmentInstance = new Analytics(key);

    const status = SegmentClient.getStatus();
    this.logger.info({ msg: `user telemetry setting: ${status}` });
    this._hasOptedOut = SegmentClient.isDisabled();

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
  }

  identifyAnonymous(props?: { [key: string]: any }, opts?: SegmentExtraArg) {
    this.identify(undefined, props, opts);
  }

  identify(
    id?: string,
    props?: { [key: string]: any },
    opts?: SegmentExtraArg
  ) {
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

  track(
    event: string,
    data?: { [key: string]: string | number | boolean },
    opts?: { context: any }
  ) {
    if (this._hasOptedOut || this._segmentInstance == null) {
      return;
    }

    const payload: { [key: string]: any } = { ...data };
    const { context } = opts || {};

    try {
      this._segmentInstance.track({
        anonymousId: this._anonymousId,
        event,
        properties: payload,
        context,
      });
    } catch (ex) {
      this.logger.error(ex);
    }
  }

  get hasOptedOut(): boolean {
    return this._hasOptedOut;
  }

  get anonymousId(): string {
    return this._anonymousId;
  }
}

export function initializeSentry(environment: string): void {
  // Setting an undefined dsn will stop uploads.
  const dsn =
    environment === "prod"
      ? "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219"
      : undefined;

  // Respect user's telemetry settings for error reporting too.
  const enabled = !SegmentClient.instance().hasOptedOut;

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    enabled,
    environment,
    beforeSend(event, hint) {
      const error = hint?.originalException;
      if (error && error instanceof DendronError) {
        event.extra = {
          name: error.name,
          message: error.message,
          payload: error.payload,
          severity: error.severity?.toString(),
          code: error.code,
          status: error.status,
          isComposite: error.isComposite,
        };
      }
      return event;
    },
  });
  return;
}

/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
export function sentryReportingCallback(
  callback: (...args: any[]) => any
): (...args: any[]) => any {
  return (args) => {
    try {
      return callback(args);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
}
