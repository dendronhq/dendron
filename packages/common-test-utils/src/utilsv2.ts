import {
  CONSTANTS,
  DendronConfig,
  DendronSiteConfig,
  DEngineClient,
  DVault,
  DWorkspace,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  CreateEngineFunction,
  EngineTestUtilsV4,
  GenTestResults,
  RunEngineTestFunctionV4,
  runJestHarnessV2,
  SetupTestFunctionV4,
} from ".";
import {
  PostSetupHookFunction,
  PreSetupHookFunction,
  SetupHookFunction,
} from "./types";

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
    let { preSetupHook, postSetupHook, extraOpts, setupTest, genTestResults } =
      opts || {};
    this.preSetupHook = preSetupHook ? preSetupHook : async () => {};
    this.postSetupHook = postSetupHook ? postSetupHook : async () => {};
    this.testFunc = _.bind(func, this);
    this.extraOpts = extraOpts;
    this.setupTest = setupTest;
    this.genTestResults = _.bind(
      genTestResults ? genTestResults : async () => [],
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

/**
 * Run engine test with relative vaults
 */
export async function runEngineTestV4(
  func: RunEngineTestFunctionV4,
  opts: {
    preSetupHook?: SetupHookFunction;
    postSetupHook?: PostSetupHookFunction;
    createEngine: CreateEngineFunction;
    extra?: any;
    expect: any;
    setupOnly?: boolean;
    singleVault?: boolean;
  }
) {
  const { preSetupHook, createEngine, extra } = _.defaults(opts, {
    preSetupHook: async ({}) => {},
    postSetupHook: async ({}) => {},
    extra: {},
  });

  const { wsRoot, vaults } = await EngineTestUtilsV4.setupWS({
    singleVault: opts.singleVault,
  });

  await preSetupHook({ wsRoot, vaults: vaults });
  DConfig.getOrCreate(wsRoot, { vaults });
  const engine = createEngine({ wsRoot, vaults: vaults });
  const initResp = await engine.init();
  const testOpts = { wsRoot, vaults, engine, initResp, extra };
  if (opts.setupOnly) {
    if (!opts.preSetupHook) {
      throw Error("no pre setup hook");
    }
    return { opts: testOpts, resp: opts.preSetupHook(testOpts) };
  }
  // const resp = await postSetupHook({wsRoot, vaults, engine})
  const results = (await func(testOpts)) || [];

  await runJestHarnessV2(results, expect);
  return { opts: testOpts, resp: undefined };
}

// TODO: c/p until we move everything over to engine-test-utils
class DConfig {
  static configPath(configRoot: string): string {
    return path.join(configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  }

  static genDefaultConfig(): DendronConfig {
    return {
      version: 1,
      vaults: [],
      useFMTitle: true,
      site: {
        copyAssets: true,
        siteHierarchies: ["root"],
        siteRootDir: "docs",
        usePrettyRefs: true,
        title: "Dendron",
        description: "Personal knowledge space",
      },
    };
  }

  static getOrCreate(
    dendronRoot: string,
    defaults?: Partial<DendronConfig>
  ): DendronConfig {
    const configPath = DConfig.configPath(dendronRoot);
    let config: DendronConfig;
    if (!fs.existsSync(configPath)) {
      config = { ...DConfig.genDefaultConfig(), ...(defaults || {}) };
      writeYAML(configPath, config);
    } else {
      config = readYAML(configPath) as DendronConfig;
    }
    return config;
  }

  /**
   * fill in defaults
   */
  static cleanSiteConfig(config: DendronSiteConfig): DendronSiteConfig {
    let out: DendronSiteConfig = _.defaults(config, {
      copyAssets: true,
      usePrettyRefs: true,
      siteNotesDir: "notes",
      siteFaviconPath: "favicon.ico",
      gh_edit_link: true,
      gh_edit_link_text: "Edit this page on GitHub",
      gh_edit_branch: "master",
      gh_root: "docs/",
      gh_edit_view_mode: "edit",
      writeStubs: true,
      description: "Personal knowledge space",
    });
    let { siteRootDir, siteHierarchies, siteIndex } = out;
    if (!siteRootDir) {
      throw `siteRootDir is undefined`;
    }
    if (_.size(siteHierarchies) < 1) {
      throw `siteHiearchies must have at least one hiearchy`;
    }
    out.siteIndex = siteIndex || siteHierarchies[0];
    return out;
  }

  static writeConfig({
    wsRoot,
    config,
  }: {
    wsRoot: string;
    config: DendronConfig;
  }) {
    const configPath = DConfig.configPath(wsRoot);
    return writeYAML(configPath, config);
  }
}
