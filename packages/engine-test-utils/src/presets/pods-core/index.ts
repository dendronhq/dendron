import SNAPSHOT from "./snapshot";
import JSON from "./json";
import MARKDOWN from "./markdown";

export const PODS_CORE = {
  SNAPSHOT,
  JSON,
  MARKDOWN,
};

export const PODS_PRESETS = [{ name: "json", presets: JSON }];
