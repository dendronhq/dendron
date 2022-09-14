import { ITelemetryClient } from "./ITelemetryClient";

/**
 * No-Op Dummy telemetry client. This doesn't upload anything and is safe to use
 * during development and testing.
 */
export class DummyTelemetryClient implements ITelemetryClient {
  track(): Promise<void> {
    return Promise.resolve();
  }
  identify(): Promise<void> {
    return Promise.resolve();
  }
}
