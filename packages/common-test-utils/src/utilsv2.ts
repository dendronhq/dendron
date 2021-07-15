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
import { Node as UnistNode } from "unist";

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
    const { preSetupHook, postSetupHook, extraOpts, setupTest, genTestResults } =
      opts || {};
    this.preSetupHook = preSetupHook || (async () => {});
    this.postSetupHook = postSetupHook || (async () => {});
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(
      genTestResults || (async () => []),
      this
    );
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

/** Gets the descendent (child, or child of child...) node of a given node.
 *
 * @param node The root node to start descending from.
 * @param indices Left-to-right indexes for children, e.g. first index is for the root, second is for the child of the root...
 * @returns Requested child. Note that this function has no way of checking types, so the child you get might not be of the right type.
 */
export function getDescendantNode<Child extends UnistNode>(
  node: UnistNode,
  ...indices: number[]
): Child {
  const index = indices.shift();
  if (_.isUndefined(index)) return node as Child;
  expect(node).toHaveProperty("children");
  expect(node.children).toHaveProperty("length");
  const children = node.children as UnistNode[];
  expect(children.length).toBeGreaterThanOrEqual(index);
  return getDescendantNode<Child>(children[index], ...indices);
}