import { tmpDir } from "@dendronhq/common-server";
import { Git } from "@dendronhq/engine-server";
import { ENGINE_HOOKS_MULTI, GitTestUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import { ConvertVaultCommand } from "../../commands/ConvertVaultCommand";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";
import fs from "fs-extra";
import { before, after, describe } from "mocha";
import {
  ConfigUtils,
  FOLDERS,
  DendronConfig,
  VaultUtils,
  ConfigService,
  URI,
} from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";

suite("GIVEN ConvertVaultCommand", function () {
  describeMultiWS(
    "WHEN converting a local vault to a remote vault",
    { preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti, timeout: 5e3 },
    () => {
      let remote: string;
      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
        sinon.stub(cmd, "gatherType").resolves("remote");
        sinon.stub(cmd, "gatherVault").resolves(vaults[0]);

        // Create a remote repository to be the upstream
        remote = tmpDir().name;
        await GitTestUtils.remoteCreate(remote);
        sinon.stub(cmd, "gatherRemoteURL").resolves(remote);

        await cmd.run();
      });
      after(async () => {
        sinon.restore();
      });

      test("THEN updates .gitignore", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
          encoding: "utf-8",
        });
        expect(contents.match(/^vault1$/m)).toBeTruthy();
      });

      test("THEN updates config", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readRaw(URI.file(wsRoot))
        )._unsafeUnwrap() as DendronConfig;
        expect(ConfigUtils.getVaults(config)[0].remote).toEqual({
          type: "git",
          url: remote,
        });
      });

      test("THEN the folder is a git repository", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const git = new Git({ localUrl: path.join(wsRoot, vaults[0].fsPath) });
        expect(await git.getRemote()).toEqual("origin");
        expect(await git.getCurrentBranch()).toBeTruthy();
      });

      describe("AND converting that back to a local vault", () => {
        before(async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
          sinon.stub(cmd, "gatherType").resolves("local");
          sinon.stub(cmd, "gatherVault").resolves(vaults[0]);

          await cmd.run();
        });
        after(async () => {
          sinon.restore();
        });

        test("THEN updates .gitignore", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
            encoding: "utf-8",
          });
          expect(contents.match(/^vault1$/m)).toBeFalsy();
        });

        test("THEN updates config", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const config = (
            await ConfigService.instance().readRaw(URI.file(wsRoot))
          )._unsafeUnwrap() as DendronConfig;
          expect(ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
        });

        test("THEN the folder is NOT a git repository", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const git = new Git({
            localUrl: path.join(wsRoot, vaults[0].fsPath),
          });
          expect(await git.getRemote()).toBeFalsy();
        });
      });
    }
  );

  describeMultiWS(
    "WHEN converting a local vault to a remote vault with self contained vaults enabled",
    {
      preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      modConfigCb: (config) => {
        config.dev = { enableSelfContainedVaults: true };
        return config;
      },
      timeout: 5e3,
    },
    () => {
      let remote: string;
      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
        sinon.stub(cmd, "gatherType").resolves("remote");
        sinon.stub(cmd, "gatherVault").resolves(vaults[0]);
        sinon.stub(cmd, "promptForFolderMove").resolves(true);

        // Create a remote repository to be the upstream
        remote = tmpDir().name;
        await GitTestUtils.remoteCreate(remote);
        sinon.stub(cmd, "gatherRemoteURL").resolves(remote);

        await cmd.run();
      });
      after(async () => {
        sinon.restore();
      });

      test("THEN updates .gitignore", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
          encoding: "utf-8",
        });
        // Should have moved under dependencies
        expect(
          contents.match(
            new RegExp(
              `^dependencies${_.escapeRegExp(path.sep)}${path.basename(
                remote
              )}`,
              "m"
            )
          )
        ).toBeTruthy();
      });

      test("THEN updates config", async () => {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readRaw(URI.file(wsRoot))
        )._unsafeUnwrap() as DendronConfig;
        expect(ConfigUtils.getVaults(config)[0].remote).toEqual({
          type: "git",
          url: remote,
        });
      });

      test("THEN the vault is moved to the right folder", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const vault = vaults[0];
        expect(
          await fs.pathExists(
            path.join(wsRoot, VaultUtils.getRelPath(vault), "root.md")
          )
        ).toBeTruthy();
        expect(vault.fsPath.startsWith(FOLDERS.DEPENDENCIES)).toBeTruthy();
        expect(vault.fsPath.endsWith(path.basename(remote))).toBeTruthy();
      });

      test("THEN the folder is a git repository", async () => {
        const ws = ExtensionProvider.getDWorkspace();
        const { wsRoot } = ws;
        const vaults = await ws.vaults;
        const git = new Git({ localUrl: path.join(wsRoot, vaults[0].fsPath) });
        expect(await git.getRemote()).toEqual("origin");
        expect(await git.getCurrentBranch()).toBeTruthy();
      });

      describe("AND converting that back to a local vault", () => {
        before(async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
          sinon.stub(cmd, "gatherType").resolves("local");
          sinon.stub(cmd, "gatherVault").resolves(vaults[0]);
          sinon.stub(cmd, "promptForFolderMove").resolves(true);

          await cmd.run();
        });
        after(async () => {
          sinon.restore();
        });

        test("THEN updates .gitignore", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
            encoding: "utf-8",
          });
          expect(contents.match(/^dependencies/m)).toBeFalsy();
        });

        test("THEN updates config", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const config = (
            await ConfigService.instance().readRaw(URI.file(wsRoot))
          )._unsafeUnwrap() as DendronConfig;
          expect(ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
        });

        test("THEN the vault is moved to the right folder", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const vault = vaults[0];
          expect(
            await fs.pathExists(
              path.join(wsRoot, VaultUtils.getRelPath(vault), "root.md")
            )
          ).toBeTruthy();
          expect(
            vault.fsPath.startsWith(
              path.join(FOLDERS.DEPENDENCIES, FOLDERS.LOCAL_DEPENDENCY)
            )
          ).toBeTruthy();
        });

        test("THEN the folder is NOT a git repository", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const git = new Git({
            localUrl: path.join(wsRoot, vaults[0].fsPath),
          });
          expect(await git.getRemote()).toBeFalsy();
        });
      });
    }
  );

  describeMultiWS(
    "WHEN given a bad remote URL",
    { preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti },
    () => {
      before(async () => {
        const vaults = await ExtensionProvider.getDWorkspace().vaults;
        const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
        sinon.stub(cmd, "gatherType").resolves("remote");
        sinon.stub(cmd, "gatherVault").resolves(vaults[0]);

        // Bad remote, not actually a vault
        const remote = tmpDir().name;
        sinon.stub(cmd, "gatherRemoteURL").resolves(remote);

        await cmd.run();
      });
      after(async () => {
        sinon.restore();
      });

      test("THEN conversion fails mid-operation", async () => {
        // config is updated after the remote is fully set up, so if the config has been updated we know that we were able to set up and push to remote
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const config = (
          await ConfigService.instance().readRaw(URI.file(wsRoot))
        )._unsafeUnwrap() as DendronConfig;
        expect(ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
      });

      describe("AND running the conversion command again", () => {
        before(async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const cmd = new ConvertVaultCommand(ExtensionProvider.getExtension());
          sinon.stub(cmd, "gatherType").resolves("remote");
          sinon.stub(cmd, "gatherVault").resolves(vaults[0]);

          // Create a remote repository to be the upstream
          const remote = tmpDir().name;
          await GitTestUtils.remoteCreate(remote);
          sinon.stub(cmd, "gatherRemoteURL").resolves(remote);

          await cmd.run();
        });
        after(async () => {
          sinon.restore();
        });

        test("THEN the conversion completes", async () => {
          // config is updated after the remote is fully set up, so if the config has been updated we know that we were able to set up and push to remote
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const config = (
            await ConfigService.instance().readRaw(URI.file(wsRoot))
          )._unsafeUnwrap() as DendronConfig;
          expect(ConfigUtils.getVaults(config)[0].remote).toBeTruthy();
        });
      });
    }
  );
});
