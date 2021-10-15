import { DVault, NoteProps } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  DConfig,
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
      await WorkspaceService.createWorkspace({ wsRoot, vaults });
      const gitignore = path.join(wsRoot, ".gitignore");
      expect(
        fs.readFileSync(gitignore, { encoding: "utf8" })
      ).toMatchSnapshot();
    });

    test("workspace Vault", async () => {
      const wsRoot = tmpDir().name;
      const vaults: DVault[] = [{ fsPath: "vault1", workspace: "foo" }];
      await WorkspaceService.createWorkspace({ wsRoot, vaults });
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
            path.join(`seeds`, `${id}`, `vault`).replace(/\\/g, "\\\\")
          );
          checkVaults(
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

    testWithEngine(
      "remoteVaults present, no initializeRemoteVaults",
      async ({ wsRoot, engine }) => {
        const root = tmpDir().name;
        await GitTestUtils.createRepoWithReadme(root);

        engine.config.vaults!.push({
          fsPath: "remoteVault",
          remote: {
            type: "git",
            url: root,
          },
        });
        engine.config.initializeRemoteVaults = false;
        DConfig.writeConfig({ wsRoot, config: engine.config });
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
    async ({ wsRoot, vaults }) => {
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
      }).commitAndAddAll();
      expect(resp.length).toEqual(3);
      expect(
        resp.filter((r) => r.status === SyncActionStatus.DONE).length
      ).toEqual(2);
    },
    { initGit: true }
  );
});
