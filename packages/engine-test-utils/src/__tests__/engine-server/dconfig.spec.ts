import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import { DConfig, LocalConfigScope } from "@dendronhq/engine-server";
import Sinon from "sinon";
import { TestEngineUtils } from "../../engine";
import { VAULTS } from "../../presets";
import { TestWorkspaceUtils } from "../../utils/workspace";

function getDefaultConfig() {
  const defaultConfig: IntermediateDendronConfig = {
    ...ConfigUtils.genDefaultConfig(),
  };
  defaultConfig.publishing.duplicateNoteBehavior = {
    action: "useVault",
    payload: ["vault1", "vault2", "vaultThree"],
  };
  defaultConfig.workspace.vaults =
    VAULTS.MULTI_VAULT_WITH_THREE_VAULTS().reverse();
  return defaultConfig;
}

function testScope(configScope: LocalConfigScope) {
  describe(`GIVEN ${configScope} config`, () => {
    const vaults = VAULTS.MULTI_VAULT_WITH_THREE_VAULTS();
    const defaultConfig = getDefaultConfig();

    // for global config, need to stub home dir
    if (configScope === LocalConfigScope.GLOBAL) {
      let homeDirStub: Sinon.SinonStub;
      beforeEach(() => {
        homeDirStub = TestEngineUtils.mockHomeDir();
      });
      afterEach(() => {
        homeDirStub.restore();
      });
    }

    const createWs = async () => {
      return TestWorkspaceUtils.create({ vaults });
    };
    describe(`AND GIVEN ${configScope} config is empty`, () => {
      test("THEN engine config should be unaltered", async () => {
        const { wsRoot } = await createWs();
        const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        expect(config).toEqual(defaultConfig);
      });
    });

    describe(`AND GIVEN ${configScope} with an additional vault`, () => {
      test("THEN engine should load with additional vault", async () => {
        const { wsRoot } = await createWs();
        const localVaults = [{ fsPath: "vault-local" }];
        await DConfig.writeLocalConfig({
          wsRoot,
          config: { workspace: { vaults: localVaults } },
          configScope,
        });
        const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        const _defaultConfig = getDefaultConfig();
        _defaultConfig.workspace.vaults = localVaults.concat(
          defaultConfig.workspace.vaults
        );
        expect(config).toEqual(_defaultConfig);
      });
    });

    describe(`AND GIVEN ${configScope} with updated workspace setting`, () => {
      test("THEN engine should load with updated workspace settings", async () => {
        const { wsRoot } = await createWs();
        await DConfig.writeLocalConfig({
          wsRoot,
          config: { workspace: { enableEditorDecorations: false } },
          configScope,
        });
        const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        const _defaultConfig = getDefaultConfig();
        _defaultConfig.workspace.enableEditorDecorations = false;
        expect(config).toEqual(_defaultConfig);
      });
    });
  });
}

describe("DConfig", () => {
  testScope(LocalConfigScope.WORKSPACE);
  testScope(LocalConfigScope.GLOBAL);

  describe("GIVEN ws config present", () => {
    const vaults = VAULTS.MULTI_VAULT_WITH_THREE_VAULTS();
    const createWs = async () => {
      return TestWorkspaceUtils.create({ vaults });
    };
    const configScope = LocalConfigScope.WORKSPACE;

    describe("AND GIVEN global config is present", () => {
      let homeDirStub: Sinon.SinonStub;

      beforeEach(() => {
        homeDirStub = TestEngineUtils.mockHomeDir();
      });
      afterEach(() => {
        homeDirStub.restore();
      });

      test("THEN ws config takes precedence", async () => {
        const { wsRoot } = await createWs();
        // write local and global config
        await Promise.all([
          DConfig.writeLocalConfig({
            wsRoot,
            config: { workspace: { enableEditorDecorations: false } },
            configScope,
          }),
          DConfig.writeLocalConfig({
            wsRoot,
            config: { workspace: { enableEditorDecorations: true } },
            configScope: LocalConfigScope.GLOBAL,
          }),
        ]);
        const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        const _defaultConfig = getDefaultConfig();
        _defaultConfig.workspace.enableEditorDecorations = false;
        expect(config).toEqual(_defaultConfig);
      });
    });
  });
});
