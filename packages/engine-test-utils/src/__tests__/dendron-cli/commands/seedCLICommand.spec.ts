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
import { SeedInitMode, WorkspaceService } from "@dendronhq/engine-server";
import os from "os";
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

// Platform agnostic check file for a seed vault path
function getSeedVaultPathForCheckFile(seedId: string) {
  return path.join(`${seedId}`, `vault`).replace("\\", "\\\\");
}

// Skip on Windows for now until reliability issues can be fixed.
//TODO: Re-enable for Windows
const runTest = os.platform() === "win32" ? describe.skip : describe;

runTest("remove", () => {
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
});

runTest("add", () => {
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
        const id = TestSeedUtils.defaultSeedId();
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
  const cmd = SeedCommands.INIT;
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
    const mode = SeedInitMode.CREATE_WORKSPACE;
    test(`basic`, async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot }) => {
          await runSeedCmd({
            id: "dendron.foo",
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
          expect(
            (await WorkspaceService.getOrCreateConfig(wsRoot))._unsafeUnwrap()
              .workspace.seeds
          ).toEqual(undefined);
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
      const resp = await runSeedCmd({
        id: "dendron.foo",
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
          expect(
            (await WorkspaceService.getOrCreateConfig(wsRoot))._unsafeUnwrap()
              .workspace.seeds
          ).toEqual(undefined);
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
