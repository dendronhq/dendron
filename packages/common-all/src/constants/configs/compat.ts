export const CONFIG_TO_MINIMUM_COMPAT_MAPPING: { [key: number]: string } = {
  1: "0.0.0",
  2: "0.63.0", // config consolidation (commands namespace)
  3: "0.65.0", // config consolidation (workspace namespace)
  4: "0.70.0", // config consolidation (preview namespace)
  5: "0.81.0", // config consolidation (publishing namespace) TODO: FIX THIS BEFORE GENERAL RELEASE
};
