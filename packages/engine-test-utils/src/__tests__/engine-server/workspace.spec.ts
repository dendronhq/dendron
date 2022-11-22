import {
  ConfigService,
  ConfigUtils,
  CONSTANTS,
  DVault,
  FOLDERS,
  NoteProps,
  URI,
} from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  SeedService,
  SyncActionStatus,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { runEngineTestV5, TestEngineUtils, testWithEngine } from "../../engine";
import {
  checkDir,
  checkFile,
  checkNotInDir,
  checkVaults,
  GitTestUtils,
} from "../../utils";
import { TestSeedUtils } from "../../utils/seed";
import sinon from "sinon";

describe("WorkspaceUtils", () => {
  describe("findWSRoot", () => {
    it("ok: same path", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          process.chdir(wsRoot);
          const wsPath = WorkspaceUtils.findWSRoot();
          // realPathSync necessary because of symlinks created by tmpdir
          // see https://stackoverflow.com/questions/31843087/unexpectedly-in-private-folder-when-changing-the-working-directory-to-a-temp-f
          expect(wsPath).toEqual(fs.realpathSync(wsRoot));
        },
        {
          expect,
        }
      );
    });

    it("ok: a few directories down", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cwd = path.join(wsRoot, "one", "two");
          fs.ensureDirSync(cwd);
          process.chdir(cwd);
          const wsPath = WorkspaceUtils.findWSRoot();
          expect(wsPath).toEqual(fs.realpathSync(wsRoot));
        },
        {
          expect,
        }
      );
    });

    it("fail: exceed 3 directroies down", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          const cwd = path.join(wsRoot, "one", "two", "three", "four");
          fs.ensureDirSync(cwd);
          process.chdir(cwd);
          const wsPath = WorkspaceUtils.findWSRoot();
          expect(wsPath).toBeUndefined();
        },
        {
          expect,
        }
      );
    });
  });
});

describe("WorkspaceService", () => {
  describe("create", () => {
    let homeDirStub: sinon.SinonStub;

    beforeEach(() => {
      homeDirStub = TestEngineUtils.mockHomeDir();
    });
    afterEach(() => {
      homeDirStub.restore();
    });
    test("basic", async () => {
      const wsRoot = tmpDir().name;
      const vaults = [{ fsPath: "vault1" }];
      await WorkspaceService.createWorkspace({
        wsRoot,
        additionalVaults: vaults,
      });
      const gitignore = path.join(wsRoot, ".gitignore");
      expect(
        fs.readFileSync(gitignore, { encoding: "utf8" })
      ).toMatchSnapshot();
    });

    test("workspace Vault", async () => {
      const wsRoot = tmpDir().name;
      const vaults: DVault[] = [{ fsPath: "vault1", workspace: "foo" }];
      await WorkspaceService.createWorkspace({
        wsRoot,
        additionalVaults: vaults,
      });
      expect(fs.existsSync(path.join(wsRoot, "foo", "vault1"))).toBeTruthy();
    });
  });

  // TODO: migrate test to src/__tests__/dendron-cli/commands/workspaceCli.spec.ts
  describe("initialize", () => {
    test("remote seed present", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          const tmp = tmpDir().name;
          const { registryFile, seedDict } =
            await TestSeedUtils.createSeedRegistry({
              engine,
              wsRoot: tmp,
            });
          const id = TestSeedUtils.defaultSeedId();
          const seedService = new SeedService({ wsRoot, registryFile });
          const seed = seedDict[TestSeedUtils.defaultSeedId()];
          await seedService.addSeedMetadata({ seed, wsRoot });
          const wsService = new WorkspaceService({ wsRoot, seedService });
          const didClone = await wsService.initialize({
            onSyncVaultsProgress: () => {},
            onSyncVaultsEnd: () => {},
          });
          expect(didClone).toEqual(true);

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
          });
          await checkFile(
            {
              fpath: path.join(wsRoot, "dendron.code-workspace"),
              snapshot: false,
            },
            // Necessary for windows test-compat:
            path.posix.join(`seeds`, `${id}`, `vault`)
          );
          await checkVaults(
            {
              wsRoot,
              vaults: [
                { fsPath: "vault", seed: id, name: id } as DVault,
              ].concat(vaults),
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

    test("remote self contained vaults present", async () => {
      await runEngineTestV5(
        async ({ wsRoot }) => {
          // Create a self contained vault that we can add to this workspace
          const tmp = tmpDir().name;
          const vaultName = "test";
          await WorkspaceService.createWorkspace({
            wsRoot: tmp,
            useSelfContainedVault: true,
            wsVault: {
              fsPath: ".",
              name: vaultName,
            },
          });
          const vaultFsPath = path.join(
            FOLDERS.DEPENDENCIES,
            "example.com",
            "example",
            vaultName
          );
          await GitTestUtils.addRepoToWorkspace(tmp);
          // Add the created self contained vault into the workspace config without actually cloning the folder
          const config = (
            await ConfigService.instance().readConfig(URI.file(wsRoot))
          )._unsafeUnwrap();
          config.workspace.vaults?.push({
            fsPath: vaultFsPath,
            name: vaultName,
            remote: {
              type: "git",
              url: tmp,
            },
          });
          await ConfigService.instance().writeConfig(URI.file(wsRoot), config);

          // Run the workspace initialization, workspace service should discover the missing vault and clone it
          const wsService = new WorkspaceService({ wsRoot });
          const didClone = await wsService.initialize({
            onSyncVaultsProgress: () => {},
            onSyncVaultsEnd: () => {},
          });
          expect(didClone).toEqual(true);

          // Cloned vault should have all the files we expect
          const vaultClonedPath = path.join(wsRoot, vaultFsPath);
          // vault should have been cloned
          await checkDir(
            { fpath: vaultClonedPath },
            CONSTANTS.DENDRON_WS_NAME,
            CONSTANTS.DENDRON_CONFIG_FILE,
            FOLDERS.NOTES
          );

          // Notes go under `vault/notes/`, so they shouldn't exist in the root
          await checkNotInDir(
            {
              fpath: vaultClonedPath,
            },
            "root.md"
          );
          // It should avoid the bug where the vault is cloned into `notes`, ending up with `vault/notes/notes`
          await checkNotInDir(
            {
              fpath: path.join(vaultClonedPath, FOLDERS.NOTES),
            },
            FOLDERS.NOTES
          );

          // The notes should exist
          await checkDir(
            {
              fpath: path.join(vaultClonedPath, FOLDERS.NOTES),
            },
            "root.md"
          );
        },
        {
          expect,
        }
      );
    });

    testWithEngine(
      "remoteVaults present, no enableRemoteVaultInit",
      async ({ wsRoot }) => {
        const root = tmpDir().name;
        await GitTestUtils.createRepoWithReadme(root);
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();

        const vaultsConfig = ConfigUtils.getVaults(config);

        vaultsConfig.push({
          fsPath: "remoteVault",
          remote: {
            type: "git",
            url: root,
          },
        });
        ConfigUtils.setVaults(config, vaultsConfig);
        ConfigUtils.setWorkspaceProp(config, "enableRemoteVaultInit", false);
        await ConfigService.instance().writeConfig(URI.file(wsRoot), config);
        const ws = new WorkspaceService({ wsRoot });
        const didClone = await ws.initialize({
          onSyncVaultsProgress: () => {},
          onSyncVaultsEnd: () => {},
        });
        expect(didClone).toBeFalsy();
        expect(
          fs.existsSync(path.join(wsRoot, "remoteVault", "README.md"))
        ).toBeFalsy();
      }
    );
  });

  testWithEngine(
    "commitAll",
    async ({ wsRoot, engine, vaults }) => {
      await NoteTestUtilsV4.modifyNoteByPath(
        { wsRoot, vault: vaults[0], fname: "foo" },
        (note: NoteProps) => {
          note.body += "\n Foo";
          return note;
        }
      );
      await NoteTestUtilsV4.createNote({
        fname: "bar",
        vault: vaults[1],
        wsRoot,
      });
      const resp = await new WorkspaceService({
        wsRoot,
      }).commitAndAddAll({ engine });
      expect(resp.length).toEqual(3);
      expect(
        resp.filter((r) => r.status === SyncActionStatus.DONE).length
      ).toEqual(2);
    },
    { initGit: true }
  );
});
