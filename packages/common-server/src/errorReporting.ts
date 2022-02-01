import { DendronError, Stage } from "@dendronhq/common-all";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import _ from "lodash";

// Extracted to make testing easy
export function rewriteFilename(filename: string) {
  // Convert backslash to forward slash; Sentry should be able to handle the rest of the formatting:
  filename = filename.split("\\").join("/");

  // Replace windows C: with nothing
  filename = filename.replace(/^[A-Za-z]:/, "");

  // Remove everything including the dendron directory, this is usually stuff like '/Users/someone/...'
  // We have to do two regexes because doing dendron(\.[A-Za-z]*-[0-9.]*)? does not work properly
  const prodRegex = /^\/.*dendron\.[A-Za-z_]*-[0-9.]*\//;
  const devRegex = /^\/.*dendron\//;
  const prefix = "app:///";

  const newFilename = filename.replace(prodRegex, prefix);
  if (newFilename !== filename) {
    return newFilename;
  } else {
    return filename.replace(devRegex, prefix);
  }
}

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
        iteratee: (frame) => {
          if (!frame.filename) {
            return frame;
          }

          frame.filename = rewriteFilename(frame.filename);

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
