import { DendronError, Stage } from "@dendronhq/common-all";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import path from "path";

export function initializeSentry(environment: Stage): void {
  const dsn =
    "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219";

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    enabled: true,
    environment,
    attachStacktrace: true,
    beforeSend: eventModifier,
    integrations: [
      new RewriteFrames({
        prefix: "app:///dist/",
        iteratee: (frame) => {
          if (frame.abs_path) {
            // Convert backslash to forward slash; Sentry should be able to handle the rest of the formatting:
            frame.abs_path = frame.abs_path
              .split(path.sep)
              .join(path.posix.sep);
          }
          return frame;
        },
      }),
    ],
  });
  return;
}

export function eventModifier(
  event: Sentry.Event,
  hint: Sentry.EventHint | undefined
): Sentry.Event | PromiseLike<Sentry.Event | null> | null {
  const error = hint?.originalException;

  // Add more information to the event extras payload:
  if (error && error instanceof DendronError) {
    event.extra = {
      name: error.name,
      message: error.message,
      payload: error.payload,
      severity: error.severity?.toString(),
      code: error.code,
      status: error.status,
      innerError: error,
    };
  }

  return event;
}
