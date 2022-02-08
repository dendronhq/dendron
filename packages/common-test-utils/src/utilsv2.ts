import {
  DEngineClient,
  DVault,
  DWorkspace,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  CreateEngineFunction,
  GenTestResults,
  RunEngineTestFunctionV4,
  SetupTestFunctionV4,
} from ".";
import { PostSetupHookFunction, PreSetupHookFunction } from "./types";

type EngineOverride = {
  [P in keyof DEngineClient]: (opts: WorkspaceOpts) => DEngineClient[P];
};

export const createEngineFactoryFactory = ({
  overrides,
  EngineClass,
}: {
  EngineClass: any;
  overrides?: Partial<EngineOverride>;
}): CreateEngineFunction => {
  const createEngine: CreateEngineFunction = (
    opts: WorkspaceOpts
  ): DEngineClient => {
    const engine = new EngineClass() as DEngineClient;
    _.map(overrides || {}, (method, key: keyof DEngineClient) => {
      // @ts-ignore
      engine[key] = method(opts);
    });
    return engine;
  };
  return createEngine;
};

class MockEngineClass {
  // eslint-disable-next-line no-empty-function
  async init() {}
}
export const createMockEngine = createEngineFactoryFactory({
  EngineClass: MockEngineClass,
});

export class TestPresetEntryV4 {
  public preSetupHook: PreSetupHookFunction;
  public postSetupHook: PostSetupHookFunction;
  public testFunc: RunEngineTestFunctionV4;
  public extraOpts: any;
  public setupTest?: SetupTestFunctionV4;
  public genTestResults?: GenTestResults;
  public vaults: DVault[];
  public workspaces: DWorkspace[];

  constructor(
    func: RunEngineTestFunctionV4,
    opts?: {
      preSetupHook?: PreSetupHookFunction;
      postSetupHook?: PostSetupHookFunction;
      extraOpts?: any;
      setupTest?: SetupTestFunctionV4;
      genTestResults?: GenTestResults;
      vaults?: DVault[];
      workspaces?: DWorkspace[];
    }
  ) {
    const {
      preSetupHook,
      postSetupHook,
      extraOpts,
      setupTest,
      genTestResults,
    } = opts || {};
    this.preSetupHook = preSetupHook || (async () => {});
    this.postSetupHook = postSetupHook || (async () => {});
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(genTestResults || (async () => []), this);
    this.workspaces = opts?.workspaces || [];
    this.vaults = opts?.vaults || [
      { fsPath: "vault1" },
      { fsPath: "vault2" },
      {
        name: "vaultThree",
        fsPath: "vault3",
      },
    ];
  }
}

/**
 * If you need to do assert/expect verification inside a callback, then use this
 * method to wrap any assert calls. Otherwise, any assert failures will result
 * in a failed promise instead of an exception, which will cause the test to
 * hang until the test timeout instead of failing immediately with the right
 * error message.
 * @param asserts a function containing your assert/expect statements that you
 * want to test in your test case
 * @param doneArg a jest or mocha done argument
 */
export function testAssertsInsideCallback(asserts: () => void, doneArg: any) {
  try {
    asserts();
    doneArg();
  } catch (err) {
    doneArg(err);
  }
}
