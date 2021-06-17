import {
  DendronError,
  DEngineClient,
  DVault,
  ERROR_STATUS,
  SeedCommands,
  SeedConfig,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { SeedCLICommand, SeedCLICommandOpts } from "@dendronhq/dendron-cli";
import {
  DConfig,
  SeedInitMode,
  SeedService,
  SeedUtils,
} from "@dendronhq/engine-server";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import {
  checkDir,
  checkFile,
  checkNotInDir,
  checkVaults,
} from "../../../utils";
import { TestSeedUtils } from "../../../utils/seed";

export const runSeedCmd = ({
  cmd,
  id,
  ...opts
}: { cmd: SeedCommands } & Omit<SeedCLICommandOpts, "server">) => {
  const cli = new SeedCLICommand();
  return cli.execute({ cmd, id, ...opts, server: {} as any });
};

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

describe("remove", () => {
  const cmd = SeedCommands.REMOVE;
  test("error: nothing to remove", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const id = BAD_SEED_ID();
        const resp = (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
        })) as { error: DendronError };
        expect(resp).toMatchSnapshot();
        expect(resp.error.status).toEqual(ERROR_STATUS.DOES_NOT_EXIST);
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
        checkVaults(
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
        checkVaults(
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

describe("add", () => {
  const cmd = SeedCommands.ADD;

  test("error: does not exist", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const id = "dendron.no-exist";
        const resp = (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
        })) as { error: DendronError };

        expect(resp).toMatchSnapshot();
        expect(resp.error.status).toEqual(ERROR_STATUS.DOES_NOT_EXIST);
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
        const id = "dendron.foo";
        (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
          registryFile,
        })) as { error: DendronError };
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
          `${id}/vault`
        );
        checkVaults(
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

describe("init", () => {
  const cmd = SeedCommands.INIT;
  const seed: SeedConfig = {
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
  describe("create workspace", async () => {
    const mode = SeedInitMode.CREATE_WORKSPACE;
    test(`basic`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          await runSeedCmd({
            cmd,
            engine,
            wsRoot,
            mode,
            config: seed,
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

  describe("convert workspace", async () => {
    const mode = SeedInitMode.CONVERT_WORKSPACE;

    const runInit = async (opts: { engine: DEngineClient; wsRoot: string }) => {
      const resp = await runSeedCmd({
        cmd,
        mode,
        config: seed,
        ...opts,
      });
      return resp?.error as DendronError | undefined;
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
