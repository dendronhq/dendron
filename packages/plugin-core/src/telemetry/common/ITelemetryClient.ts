export interface ITelemetryClient {
  track(
    event: string,
    customProps?: any,
    segmentProps?: { timestamp?: Date }
  ): Promise<void>;

  identify(): Promise<void>;
}
