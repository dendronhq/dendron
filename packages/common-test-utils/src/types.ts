import { DVault } from "@dendronhq/common-all";

export type TestResult = {
  actual: any;
  expected: any;
  msg?: string;
};

export type SetupHookFunction = (opts: {
  wsRoot: string;
  vaults: DVault[];
}) => Promise<void>;
