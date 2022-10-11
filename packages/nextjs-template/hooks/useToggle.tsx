import { useState } from "react";
import isUndefined from "lodash/isUndefined";
import { __String } from "typescript";

const DevNoticeKey = "next-template-notice-slow-toggle";
export const useToggle = (
  defaultVal: boolean = true,
  _key: string = DevNoticeKey
) => {
  const [val, setVal] = useState(defaultVal);
  const toggle = (override?: boolean) => setVal(!isUndefined(override) || !val);
  return [val, toggle] as const;
};
