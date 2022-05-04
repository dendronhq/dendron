import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import { DConfig, LocalConfigScope } from "@dendronhq/engine-server";
import _ from "lodash";
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

describe("DConfig", () => {
  describe("GIVEN local config present", () => {
    const vaults = VAULTS.MULTI_VAULT_WITH_THREE_VAULTS();
    const defaultConfig = getDefaultConfig();

    describe("AND GIVEN local config is empty", () => {
      test("THEN engine config should be unaltered", async () => {
        const resp = await TestWorkspaceUtils.create({ vaults });
        const config = DConfig.readConfigAndApplyLocalOverrideSync(resp.wsRoot);
        expect(config).toEqual(defaultConfig);
      });
    });

    describe("AND GIVEN local config with an additional vault", () => {
      test("THEN engine should load with additional vault", async () => {
        const { wsRoot } = await TestWorkspaceUtils.create({ vaults });
        const localVaults = [{ fsPath: "vault-local" }];
        await DConfig.writeLocalConfig({
          wsRoot,
          config: { workspace: { vaults: localVaults } },
          configScope: LocalConfigScope.WORKSPACE,
        });
        const config = DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
        const _defaultConfig = getDefaultConfig();
        _defaultConfig.workspace.vaults = localVaults.concat(
          defaultConfig.workspace.vaults
        );
        expect(config).toEqual(_defaultConfig);
      });
    });
  });
});
