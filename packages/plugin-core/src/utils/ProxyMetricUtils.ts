import {
  EngagementEvents,
  RefactoringCommandUsedPayload,
} from "@dendronhq/common-all";
import { AnalyticsUtils } from "./analytics";

export class ProxyMetricUtils {
  static trackRefactoringProxyMetric(opts: {
    props: RefactoringCommandUsedPayload;
    extra: {
      [key: string]: any;
    };
  }) {
    const { props, extra } = opts;
    const payload = {
      ...props,
      ...extra,
    };
    AnalyticsUtils.track(EngagementEvents.RefactoringCommandUsed, payload);
  }
}
