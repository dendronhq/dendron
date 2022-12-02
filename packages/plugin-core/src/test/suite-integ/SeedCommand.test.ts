import { tmpDir } from "@dendronhq/common-server";
import { SeedService } from "@dendronhq/engine-server";
import { TestSeedUtils } from "@dendronhq/engine-test-utils";
import { DENDRON_COMMANDS } from "../../constants";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { PluginTestSeedUtils } from "../utils/TestSeedUtils";

suite(DENDRON_COMMANDS.SEED_ADD.key, function seedAddTests() {
  const ctx = setupBeforeAfter(this, {});

  test("ok: add seed", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();
        const seedService = new SeedService({ wsRoot, registryFile });
        const { cmd, fakedOnUpdating, fakedOnUpdated } =
          PluginTestSeedUtils.getFakedAddCommand(seedService);

        const resp = await cmd.execute({ seedId: id });
        expect(resp.error).toBeFalsy();
        expect(resp.data?.seed.name).toEqual("foo");
        expect(resp.data?.seedPath?.includes("dendron.foo")).toBeTruthy();

        expect(fakedOnUpdating.callCount).toEqual(1);
        expect(fakedOnUpdated.callCount).toEqual(1);
        done();
      },
    });
  });

  test("error: try to add duplicate seed", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();
        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        const { cmd, fakedOnUpdating, fakedOnUpdated } =
          PluginTestSeedUtils.getFakedAddCommand(seedService);

        const resp = await cmd.execute({ seedId: id });
        expect(resp.error).toBeTruthy();

        expect(fakedOnUpdating.callCount).toEqual(0);
        expect(fakedOnUpdated.callCount).toEqual(0);

        done();
      },
    });
  });
});

// TODO: fix test (ConfigStore)
suite(DENDRON_COMMANDS.SEED_REMOVE.key, function seedRemoveTests() {
  const ctx = setupBeforeAfter(this, {});

  test("ok: remove seed", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();
        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        const { cmd, fakedOnUpdating, fakedOnUpdated } =
          PluginTestSeedUtils.getFakedRemoveCommand(seedService);

        const resp = await cmd.execute({ seedId: id });
        expect(resp.error).toBeFalsy();

        expect(fakedOnUpdating.callCount).toEqual(1);
        expect(fakedOnUpdated.callCount).toEqual(1);

        done();
      },
    });
  });

  test("error: remove non-existent seed", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();
        const seedService = new SeedService({ wsRoot, registryFile });

        const { cmd, fakedOnUpdating, fakedOnUpdated } =
          PluginTestSeedUtils.getFakedRemoveCommand(seedService);

        const resp = await cmd.execute({ seedId: id });
        expect(resp.error).toBeTruthy();
        expect(resp.data).toBeFalsy();

        expect(fakedOnUpdating.callCount).toEqual(0);
        expect(fakedOnUpdated.callCount).toEqual(0);

        done();
      },
    });
  });
});
