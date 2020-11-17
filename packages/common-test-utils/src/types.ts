import { DVault } from "@dendronhq/common-all";

export type TestResult = {
  actual: any;
  expected: any;
  msg?: string;
};

export type SetupHookFunction<T = any> = (opts: {
  wsRoot: string;
  vaults: DVault[];
}) => Promise<T>;
