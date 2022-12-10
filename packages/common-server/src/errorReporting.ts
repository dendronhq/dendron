import { DendronError, Stage } from "@dendronhq/common-all";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { NodeOptions } from "@sentry/node/types";
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

// This offers some protection against accidentally sending too many errors to Sentry
const BAD_ERROR_SAMPLE_RATE = 0.001;

export function isBadErrorThatShouldBeSampled(
  error: string | Error | { message: string } | null | undefined
) {
  return (
    error &&
    typeof error !== "string" &&
    error.message &&
    error.message.includes("ENOENT: no such file or directory")
  );
}

/**
 * Initialize Sentry
 * @param environment
 * @returns
 *  ^4wcl13fw6gub
 */
export function initializeSentry({
  environment,
  sessionId,
  release,
}: {
  environment: Stage;
  sessionId?: number;
  release: string;
}): void {
  const dsn =
    "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219";

  const initialScope: NodeOptions["initialScope"] = {};
  if (sessionId) {
    initialScope.tags = { sessionId };
  }

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    // Error stack trace sample rate: send all errors to sentry
    sampleRate: 1.0,
    // Transaction sample rate. Transactions are activities like page loads and api calls
    // The configuration property name is a bit misleading. We don't use them right now.
    tracesSampleRate: 0.0,
    enabled: true,
    environment,
    release,
    attachStacktrace: true,
    beforeSend: eventModifier,
    initialScope,
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

  if (
    isBadErrorThatShouldBeSampled(error) &&
    Math.random() > BAD_ERROR_SAMPLE_RATE
  ) {
    return null;
  }

  // Add more information to the event extras payload:
  if (error && error instanceof DendronError) {
    // This is a bit hacky because it overwrites the existing extra context
    // TODO: figure out how to handle contexts in a uniform way
    event.extra = {
      ...event.extra,
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
