import { CONSTANTS, env, genUUID } from "@dendronhq/common-all";
import Analytics from "analytics-node";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
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
  optOut?: boolean;
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

export class SegmentClient {
  public _segmentInstance: Analytics;
  private _anonymousId: string;
  public _hasOptedOut: boolean;
  private logger: DLogger;

  static _singleton: undefined | SegmentClient;

  static instance(opts?: SegmentClientOpts) {
    if (_.isUndefined(this._singleton) || opts?.forceNew) {
      this._singleton = new SegmentClient(opts);
    }
    return this._singleton;
  }

  static getConfigPath() {
    return path.join(os.homedir(), CONSTANTS.DENDRON_NO_TELEMETRY);
  }

  static isDisabled() {
    return fs.existsSync(this.getConfigPath());
  }

  static disable() {
    fs.writeFileSync(this.getConfigPath(), "");
  }

  static enable() {
    fs.removeSync(this.getConfigPath());
  }

  constructor(opts?: SegmentClientOpts) {
    const key = env("SEGMENT_VSCODE_KEY");
    this.logger = createLogger("SegmentClient");
    this._segmentInstance = new Analytics(key);
    this._hasOptedOut = opts?.optOut || SegmentClient.isDisabled() || false;
    if (this._hasOptedOut) {
      this.logger.info({ msg: "user opted out of telemetry" });
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
}
