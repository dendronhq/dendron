import { env } from "@dendronhq/common-all";
import Analytics from "analytics-node";
import _ from "lodash";

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

export const SEGMENT_EVENTS = {
  SiteEvents,
  SubscriptionEvents,
};

export class SegmentClient {
  public client: Analytics;

  static _singleton: undefined | SegmentClient;

  static instance() {
    if (_.isUndefined(this._singleton)) {
      this._singleton = new SegmentClient();
    }
    return this._singleton;
  }

  constructor() {
    const key = env("SEGMENT_WEB_KEY");
    this.client = new Analytics(key);
  }
}

// EXAMPLES:
function demoPublishFunnel() {
  const seg = SegmentClient.instance();
  const userId = "test-user3";
  seg.client.identify({ userId });
  seg.client.track({ userId, event: SiteEvents.PUBLISH_CLICKED });
  seg.client.track({ userId, event: SiteEvents.SOURCE_INFO_ENTER });
  seg.client.track({ userId, event: SiteEvents.UPDATE_START });
  seg.client.track({ userId, event: SiteEvents.VISIT_SITE });
}

function demoRevenueEvent() {
  const seg = SegmentClient.instance();
  const userId = "test-user3";
  seg.client.track({
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
