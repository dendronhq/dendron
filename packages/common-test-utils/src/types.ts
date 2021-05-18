import { DEngineClient, DVault, WorkspaceOpts } from "@dendronhq/common-all";

export type TestResult = {
  actual: any;
  expected: any;
  msg?: string;
};

export type EngineOpt = {
  engine: DEngineClient;
};

export type SetupHookFunction<T = any> = (
  opts: {
    engine?: DEngineClient;
  } & WorkspaceOpts
) => Promise<T>;

export type PreSetupHookFunction<T = any> = (
  opts: WorkspaceOpts & { extra?: any }
) => Promise<T>;
export type PreSetupHookFunctionV4<T = any> = (opts: {
  wsRoot: string;
  vault: DVault;
  vpath: string;
}) => Promise<T>;

export type PreSetupCmdHookFunction<T = any> = (
  opts: Pick<WorkspaceOpts, "wsRoot">
) => Promise<T>;

export type PostSetupHookFunction<T = any> = (
  opts: {
    engine: DEngineClient;
    extra?: any;
  } & WorkspaceOpts
) => Promise<T>;
