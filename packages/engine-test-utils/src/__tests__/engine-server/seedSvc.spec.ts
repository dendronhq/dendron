import {
  DEngineClient,
  DVault,
  ERROR_STATUS,
  SeedConfig,
} from "@dendronhq/common-all";
import { DConfig, tmpDir } from "@dendronhq/common-server";
import { SeedInitMode, SeedService, SeedUtils } from "@dendronhq/engine-server";
import os from "os";
import path from "path";
import { runEngineTestV5 } from "../../engine";
import { checkDir, checkFile, checkNotInDir, checkVaults } from "../../utils";
import { TestSeedUtils } from "../../utils/seed";

const BAD_SEED_ID = () => "dendron.no-exist";

async function createSeed({ engine }: { engine: DEngineClient }) {
  const tmp = tmpDir().name;
  const { registryFile, seedDict } = await TestSeedUtils.createSeedRegistry({
    engine,
    wsRoot: tmp,
  });
  const seedId = TestSeedUtils.defaultSeedId();
  return { registryFile, seedDict, seedId };
}

// Platform agnostic check file for a seed vault path
function getSeedVaultPathForCheckFile(seedId: string) {
  return path.join(`${seedId}`, `vault`).replace("\\", "\\\\");
}

// Skip on Windows for now until reliability issues can be fixed.
//TODO: Re-enable for Windows
const runTest = os.platform() === "win32" ? describe.skip : describe;

runTest("remove", () => {
  test("error: nothing to remove", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const id = BAD_SEED_ID();
        const seedService = new SeedService({ wsRoot });
        const resp = await seedService.removeSeed({ id });

        expect(resp.error?.status).toEqual(ERROR_STATUS.DOES_NOT_EXIST);
      },
      {
        expect,
      }
    );
  });

  test("ok: remove non-initialized seed", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        // create seed
        const {
          registryFile,
          seedDict,
          seedId: id,
        } = await createSeed({ engine });

        // add seed to config;
        const seed = seedDict[id];
        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeedMetadata({ seed, wsRoot });

        // remove seed
        await seedService.removeSeed({ id });

        await checkFile({
          fpath: path.join(wsRoot, "dendron.yml"),
          snapshot: true,
        });
        await checkVaults(
          {
            wsRoot,
            vaults,
          },
          expect
        );
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });

  test("ok: remove initialized seed", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        // create seed
        const { registryFile, seedId: id } = await createSeed({ engine });

        // add seed to config;
        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        // remove seed
        await seedService.removeSeed({ id });

        const seedPath = SeedUtils.seed2Path({ wsRoot, id });
        await checkNotInDir(
          { fpath: path.dirname(seedPath), snapshot: true },
          id
        );
        expect(id).toMatchSnapshot();
        await checkFile({
          fpath: path.join(wsRoot, "dendron.yml"),
          snapshot: true,
        });
        await checkVaults(
          {
            wsRoot,
            vaults,
          },
          expect
        );
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });
});

runTest("add", () => {
  test("error: does not exist", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const id = "dendron.no-exist";

        const seedService = new SeedService({ wsRoot });
        const resp = await seedService.addSeed({ id });

        expect(resp.error?.status).toEqual(ERROR_STATUS.DOES_NOT_EXIST);
      },
      {
        expect,
      }
    );
  });

  test("ok: exists", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();

        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        // seed should be added
        await checkDir(
          { fpath: path.join(wsRoot, "seeds", id), snapshot: true },
          "dendron.yml",
          "seed.yml",
          "vault"
        );
        // seed.yml should not be present in the workspace
        await checkNotInDir(
          {
            fpath: wsRoot,
            snapshot: true,
          },
          "seed.yml"
        );
        await checkFile({
          fpath: path.join(wsRoot, "dendron.yml"),
          snapshot: true,
        });
        await checkFile(
          {
            fpath: path.join(wsRoot, "dendron.code-workspace"),
            snapshot: true,
          },
          getSeedVaultPathForCheckFile(id)
        );
        await checkVaults(
          {
            wsRoot,
            vaults: [{ fsPath: "vault", seed: id, name: id } as DVault].concat(
              vaults
            ),
          },
          expect
        );
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });

  test("ok: seed with site", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
          modifySeed: (seed) => {
            seed.site = {
              url: "https://foo.com",
              index: "foo",
            };
            return seed;
          },
        });
        const id = TestSeedUtils.defaultSeedId();

        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        // seed should be added
        await checkDir(
          { fpath: path.join(wsRoot, "seeds", id), snapshot: true },
          "dendron.yml",
          "seed.yml",
          "vault"
        );
        // seed.yml should not be present in the workspace
        await checkNotInDir(
          {
            fpath: wsRoot,
            snapshot: true,
          },
          "seed.yml"
        );
        await checkFile(
          {
            fpath: path.join(wsRoot, "dendron.yml"),
            snapshot: true,
          },
          "url: https://foo.com",
          "index: foo"
        );
        await checkFile(
          {
            fpath: path.join(wsRoot, "dendron.code-workspace"),
            snapshot: true,
          },
          getSeedVaultPathForCheckFile(id)
        );
        await checkVaults(
          {
            wsRoot,
            vaults: [{ fsPath: "vault", seed: id, name: id } as DVault].concat(
              vaults
            ),
          },
          expect
        );
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });
});

runTest("init", () => {
  const seed: SeedConfig = {
    id: "dendron.foo",
    name: "foo",
    publisher: "dendron",
    description: "some foo",
    license: "CC",
    root: "vault",
    repository: {
      type: "git",
      url: "",
    },
  };
  runTest("create workspace", () => {
    test(`basic`, async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const seedService = new SeedService({ wsRoot });
          await seedService.init({
            seed,
            wsRoot,
            mode: SeedInitMode.CREATE_WORKSPACE,
          });

          await checkDir(
            {
              fpath: wsRoot,
              snapshot: true,
            },
            "dendron.yml",
            "seed.yml",
            "dendron.code-workspace",
            "vault"
          );
          await checkFile({
            fpath: path.join(wsRoot, "dendron.yml"),
            snapshot: true,
          });
          await checkFile({
            fpath: path.join(wsRoot, "seed.yml"),
            snapshot: true,
          });
          await checkVaults(
            {
              wsRoot,
              vaults: [
                {
                  fsPath: "vault",
                },
              ],
            },
            expect
          );
          expect(DConfig.getOrCreate(wsRoot).seeds).toEqual(undefined);
        },
        {
          expect,
          preSetupHook: async () => {},
          vaults: [],
        }
      );
    });
  });

  runTest("convert workspace", () => {
    const mode = SeedInitMode.CONVERT_WORKSPACE;

    const runInit = async (opts: { engine: DEngineClient; wsRoot: string }) => {
      const seedService = new SeedService({ wsRoot: opts.wsRoot });
      const resp = await seedService.init({ seed, wsRoot: opts.wsRoot, mode });

      return resp.error;
    };

    test(`error: no vaults`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const error = await runInit({ engine, wsRoot });
          expect(error?.message).toContain(
            "workspace must have exactly one vault"
          );
          await checkDir(
            {
              fpath: wsRoot,
              snapshot: true,
            },
            "dendron.yml"
          );
          await checkFile({
            fpath: path.join(wsRoot, "dendron.yml"),
            snapshot: true,
          });
          expect(DConfig.getOrCreate(wsRoot).seeds).toEqual(undefined);
        },
        {
          expect,
          vaults: [],
        }
      );
    });

    test(`error: wsVault`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const error = await runInit({ engine, wsRoot });
          expect(error?.message).toEqual("workspace vaults not supported");
        },
        {
          expect,
          vaults: [],
          workspaces: [
            {
              name: "fooWorkspace",
              vaults: [{ fsPath: "vault" }],
              remote: { type: "git", url: "" },
            },
          ],
        }
      );
    });

    test(`ok: diff root name`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const error = await runInit({ engine, wsRoot });
          expect(error).toBeUndefined();
          await checkDir(
            {
              fpath: wsRoot,
              snapshot: true,
            },
            "dendron.yml",
            "seed.yml"
          );
          await checkFile({
            fpath: path.join(wsRoot, "dendron.yml"),
            snapshot: true,
          });
          await checkFile(
            {
              fpath: path.join(wsRoot, "seed.yml"),
              snapshot: true,
            },
            "root: fooVault"
          );
        },
        {
          expect,
          vaults: [{ fsPath: "fooVault" }],
        }
      );
    });
  });
});

runTest("helpers", () => {
  test("ok: isSeedInWorkspace false", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const id = "dendron.no-exist";

        const seedService = new SeedService({ wsRoot });
        expect(seedService.isSeedInWorkspace(id)).toBeFalsy();
      },
      {
        expect,
      }
    );
  });

  test("ok: getSeedsInWorkspace empty", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const seedService = new SeedService({ wsRoot });
        const seedsInWS = seedService.getSeedsInWorkspace();

        expect(seedsInWS.length).toEqual(0);
      },
      {
        expect,
      }
    );
  });

  test("ok: isSeedInWorkspace true", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();

        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        expect(seedService.isSeedInWorkspace(id)).toBeTruthy();
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });

  test("ok: getSeedsInWorkspace non-empty", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const tmp = tmpDir().name;
        const { registryFile } = await TestSeedUtils.createSeedRegistry({
          engine,
          wsRoot: tmp,
        });
        const id = TestSeedUtils.defaultSeedId();

        const seedService = new SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });

        const seedsInWS = seedService.getSeedsInWorkspace();
        expect(seedsInWS.length).toEqual(1);
      },
      {
        expect,
        addVSWorkspace: true,
      }
    );
  });
});
