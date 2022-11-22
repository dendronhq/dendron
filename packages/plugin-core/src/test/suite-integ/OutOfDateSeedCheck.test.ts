import { tmpDir } from "@dendronhq/common-server";
import { before } from "mocha";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import { ExtensionProvider } from "../../ExtensionProvider";
import { SinonStubbedFn } from "@dendronhq/common-test-utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { TestSeedUtils } from "@dendronhq/engine-test-utils";
import { SeedService } from "@dendronhq/engine-server";
import sinon from "sinon";
import {
  detectOutOfDateSeeds,
  UPDATE_SEED_CONFIG_PROMPT,
} from "../../commands/Sync";
import {
  ConfigUtils,
  FOLDERS,
  DendronConfig,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import { PluginTestSeedUtils } from "../utils/TestSeedUtils";

suite("GIVEN out of date seed check", function () {
  describeSingleWS("WHEN there's a seed with an out-of-date path", {}, () => {
    const seedKey = "dendron.foo";
    let showMessage: SinonStubbedFn<typeof VSCodeUtils["showMessage"]>;
    before(async () => {
      const { engine } = ExtensionProvider.getDWorkspace();
      const wsRoot = engine.wsRoot;

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
        seedId: "dendron.foo",
      });

      // Swap the seed registry stub with one where the seed path is modified
      const modifiedTestSeeds = await TestSeedUtils.createSeedRegistry({
        engine,
        wsRoot: seedRoot,
        modifySeed: (seed) => {
          seed.root = FOLDERS.NOTES;
          return seed;
        },
      });
      const modifiedSeedService = new SeedService({
        wsRoot,
        registryFile: modifiedTestSeeds.registryFile,
      });
      sinon.stub(VSCodeUtils, "reloadWindow");
      await detectOutOfDateSeeds({ wsRoot, seedSvc: modifiedSeedService });
    });

    test("THEN Dendron prompts to update the seed config", () => {
      expect(showMessage.calledOnce).toBeTruthy();
    });

    test("THEN seed config is correctly updated", async () => {
      const { wsRoot } = ExtensionProvider.getDWorkspace();
      const config = (
        await ConfigService.instance().readRaw(URI.file(wsRoot))
      )._unsafeUnwrap() as DendronConfig;
      const seed = ConfigUtils.getVaults(config).find(
        (vault) => vault.seed === seedKey
      );
      expect(seed?.fsPath).toEqual(FOLDERS.NOTES);
    });
  });
});
