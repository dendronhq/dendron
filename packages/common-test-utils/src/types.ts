import { DEngineClientV2, DVault } from "@dendronhq/common-all";

export type TestResult = {
  actual: any;
  expected: any;
  msg?: string;
};

export type WorkspaceOpts = {
  wsRoot: string;
  vaults: DVault[];
};

export type SetupHookFunction<T = any> = (
  opts: {
    engine?: DEngineClientV2;
  } & WorkspaceOpts
) => Promise<T>;

export type PostSetupHookFunction<T = any> = (
  opts: {
    engine: DEngineClientV2;
  } & WorkspaceOpts
) => Promise<T>;
