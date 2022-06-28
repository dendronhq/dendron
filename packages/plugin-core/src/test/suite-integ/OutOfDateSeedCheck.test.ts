import { tmpDir } from "@dendronhq/common-server";
import { before } from "mocha";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import { ExtensionProvider } from "../../ExtensionProvider";
import { SinonStubbedFn } from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { TestSeedUtils } from "@dendronhq/engine-test-utils";
import {
  DConfig,
  SeedService,
  SeedUtils,
  WorkspaceService,
} from "@dendronhq/engine-server";
import sinon from "sinon";
import {
  detectOutOfDateSeeds,
  UPDATE_SEED_CONFIG_PROMPT,
} from "../../commands/Sync";
import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import { PluginTestSeedUtils } from "../utils/TestSeedUtils";

suite("GIVEN out of date seed check", function () {
  describeSingleWS("WHEN there's a seed with an out-of-date path", {}, () => {
    const seedKey = "dendron.foo";
    let showMessage: SinonStubbedFn<typeof VSCodeUtils["showMessage"]>;
    before(async () => {
      const { engine } = ExtensionProvider.getDWorkspace();
      const wsRoot = engine.wsRoot;
      const seedId = "dendron.foo";

      // Create the seed and add it into the workspace
      const seedRoot = tmpDir().name;
      const testSeeds = await TestSeedUtils.createSeedRegistry({
        engine,
        wsRoot: seedRoot,
      });
      const seedService = new SeedService({
        wsRoot,
        registryFile: testSeeds.registryFile,
      });
      showMessage = sinon.stub(VSCodeUtils, "showMessage").resolves({
        title: UPDATE_SEED_CONFIG_PROMPT,
      });
      await PluginTestSeedUtils.getFakedAddCommand(seedService).cmd.execute({
        seedId,
      });

      // Convert the seed into a self contained vault
      const seedPath = SeedUtils.seed2Path({ wsRoot, id: seedId });
      const seedWorkspaceService = new WorkspaceService({ wsRoot: seedPath });
      await seedWorkspaceService.migrateVaultToSelfContained({
        vault: ConfigUtils.getVaults(seedWorkspaceService.config)[0],
      });

      // Check if out of date seed detection notices that the seed has migrated
      sinon.stub(VSCodeUtils, "reloadWindow");
      await detectOutOfDateSeeds({ wsRoot, seedSvc: seedService });
    });

    test("THEN Dendron prompts to update the seed config", () => {
      expect(showMessage.calledOnce).toBeTruthy();
    });

    test("THEN seed config is correctly updated", async () => {
      const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
      const conf = DConfig.getRaw(wsRoot) as IntermediateDendronConfig;
      const seed = ConfigUtils.getVaults(conf).find(
        (vault) => vault.seed === seedKey
      );
      expect(seed?.fsPath).toEqual("vault/notes");
    });
  });
});
