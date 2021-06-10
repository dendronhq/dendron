import {
  DendronError,
  DEngineClient,
  ERROR_STATUS,
  SeedCommands,
  SeedConfig,
} from "@dendronhq/common-all";
import { SeedCLICommand, SeedCLICommandOpts } from "@dendronhq/dendron-cli";
import { DConfig, SeedInitMode } from "@dendronhq/engine-server";
import path from "path";
import { runEngineTestV5 } from "../../../engine";
import { checkDir, checkFile, checkVaults } from "../../../utils";

const runSeedCmd = ({
  cmd,
  id,
  ...opts
}: { cmd: SeedCommands } & Omit<SeedCLICommandOpts, "server">) => {
  const cli = new SeedCLICommand();
  return cli.execute({ cmd, id, ...opts, server: {} as any });
};

describe(SeedCommands.ADD, () => {
  const cmd = SeedCommands.ADD;
  test("does not exist", async () => {
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

  test("exists exist", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const id = "dendron.dendron-site";
        const resp = (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
        })) as { error: DendronError };
        expect(resp).toMatchSnapshot();
        expect(wsRoot).toMatchSnapshot();
        expect(resp.error.status).toEqual(ERROR_STATUS.DOES_NOT_EXIST);
      },
      {
        expect,
      }
    );
  });
});

describe.only(SeedCommands.INIT, () => {
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
  describe(SeedInitMode.CREATE_WORKSPACE, async () => {
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

  describe(SeedInitMode.CONVERT_WORKSPACE, async () => {
    const mode = SeedInitMode.CONVERT_WORKSPACE;

    const runInit = async (opts: { engine: DEngineClient; wsRoot: string }) => {
      const resp = await runSeedCmd({
        cmd,
        mode,
        config: seed,
        ...opts,
      });
      return resp.error as DendronError | undefined;
    };

    test(`error: no vaults`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          const error = await runInit({ engine, wsRoot });
          expect(error?.message).toEqual(
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

describe.skip(SeedCommands.INIT, () => {
  const cmd = SeedCommands.INIT;
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot }) => {
        const id = "dendron.dendron-site";
        const { data: resp } = (await runSeedCmd({
          cmd,
          id,
          engine,
          wsRoot,
        })) as { data: SeedConfig };
        expect(resp).toMatchSnapshot();
        expect(resp.name).toEqual("dendron-site");
      },
      {
        expect,
      }
    );
  });
});
