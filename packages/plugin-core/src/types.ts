export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};

export type DateTimeFormat =
  | "DATETIME_FULL"
  | "DATETIME_FULL_WITH_SECONDS"
  | "DATETIME_HUGE"
  | "DATETIME_HUGE_WITH_SECONDS"
  | "DATETIME_MED"
  | "DATETIME_MED_WITH_SECONDS"
  | "DATETIME_SHORT"
  | "DATETIME_SHORT_WITH_SECONDS"
  | "DATE_FULL"
  | "DATE_HUGE"
  | "DATE_MED"
  | "DATE_MED_WITH_WEEKDAY"
  | "DATE_SHORT"
  | "TIME_24_SIMPLE"
  | "TIME_24_WITH_LONG_OFFSET"
  | "TIME_24_WITH_SECONDS"
  | "TIME_24_WITH_SHORT_OFFSET"
  | "TIME_SIMPLE"
  | "TIME_WITH_LONG_OFFSET"
  | "TIME_WITH_SECONDS"
  | "TIME_WITH_SHORT_OFFSET";

export enum CodeConfigKeys {
  DEFAULT_TIMESTAMP_DECORATION_FORMAT = "dendron.defaultTimestampDecorationFormat",
}

export interface IBaseCommand<
  TOpts = any,
  TOut = any,
  TGatherOutput = TOpts,
  TRunOpts = TOpts
> {
  /**
   * Optional method to add properties to the analytics payload
   * @param opts - Arguments passed to execute()
   * @param out - return value from execute()
   */
  addAnalyticsPayload?(opts?: TOpts, out?: TOut): any;

  /**
   * Get inputs from the user
   */
  gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined>;

  /**
   * Run a command
   * @param args
   */
  run(args?: Partial<TRunOpts>): Promise<TOut | undefined>;
}
