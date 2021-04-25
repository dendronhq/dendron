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
const REVENUE_EVENT = "revenue";

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

  constructor(opts?: SegmentClientOpts) {
    const key = env("SEGMENT_VSCODE_KEY");
    this.logger = createLogger("SegmentClient");
    this._segmentInstance = new Analytics(key);
    this._hasOptedOut = opts?.optOut || false;

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

  identify(_id: string, props?: { [key: string]: any }) {
    if (this._hasOptedOut || this._segmentInstance == null) {
      return;
    }
    try {
      this._segmentInstance.identify({
        anonymousId: this._anonymousId,
        traits: props,
      });
      this._segmentInstance.flush();
    } catch (ex) {
      this.logger.error(ex);
    }
  }

  track(event: string, data?: { [key: string]: string | number | boolean }) {
    if (this._hasOptedOut || this._segmentInstance == null) {
      return;
    }

    const payload: { [key: string]: any } = { ...data };

    try {
      this._segmentInstance.track({
        anonymousId: this._anonymousId,
        event,
        properties: payload,
      });
      this._segmentInstance.flush();
    } catch (ex) {
      this.logger.error(ex);
    }
  }
}

// EXAMPLES:
function demoPublishFunnel() {
  const seg = SegmentClient.instance();
  const userId = "test-user3";
  seg._segmentInstance.identify({ userId });
  seg._segmentInstance.track({ userId, event: SiteEvents.PUBLISH_CLICKED });
  seg._segmentInstance.track({ userId, event: SiteEvents.SOURCE_INFO_ENTER });
  seg._segmentInstance.track({ userId, event: SiteEvents.UPDATE_START });
  seg._segmentInstance.track({ userId, event: SiteEvents.VISIT_SITE });
}

function demoRevenueEvent() {
  const seg = SegmentClient.instance();
  const userId = "test-user3";
  seg._segmentInstance.track({
    userId,
    event: REVENUE_EVENT,
    properties: {
      $price: 4,
      $quantity: 1,
      $revenue: "4",
      source: UserTier.SEED,
    },
  });
}

export function main() {
  demoPublishFunnel();
  demoRevenueEvent();
  console.log("done");
}

/**
 * Uncomment the below
 * ts-node --log-error ./src/analytics.ts
 */
// main();
