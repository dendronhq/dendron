import { tmpDir } from "@dendronhq/common-server";
import { DConfig, Git } from "@dendronhq/engine-server";
import { ENGINE_HOOKS_MULTI, GitTestUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import { VaultConvertCommand } from "../../commands/VaultConvert";
import { getDWorkspace } from "../../workspace";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import fs from "fs-extra";
import { before, after, describe } from "mocha";

suite("GIVEN VaultConvert", function () {
  const ctx = setupBeforeAfter(this, {});

  describeMultiWS(
    "WHEN converting a local vault to a remote vault",
    { ctx, preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti },
    () => {
      let remote: string;
      before(async () => {
        const { vaults } = getDWorkspace();
        const cmd = new VaultConvertCommand();
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
        const { wsRoot } = getDWorkspace();
        const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
          encoding: "utf-8",
        });
        expect(contents.match(/^vault1$/m)).toBeTruthy();
      });

      test("THEN updates config", async () => {
        const { wsRoot } = getDWorkspace();
        const config = DConfig.getRaw(wsRoot);
        expect(config.vaults![0].remote).toEqual({ type: "git", url: remote });
      });

      test("THEN the folder is a git repository", async () => {
        const { wsRoot, vaults } = getDWorkspace();
        const git = new Git({ localUrl: path.join(wsRoot, vaults[0].fsPath) });
        expect(await git.getUpstream()).toEqual("origin");
        expect(await git.getCurrentBranch()).toBeTruthy();
      });

      describe("AND converting that back to a local vault", () => {
        before(async () => {
          const { vaults } = getDWorkspace();
          const cmd = new VaultConvertCommand();
          sinon.stub(cmd, "gatherType").resolves("local");
          sinon.stub(cmd, "gatherVault").resolves(vaults[0]);

          await cmd.run();
        });
        after(async () => {
          sinon.restore();
        });

        test("THEN updates .gitignore", async () => {
          const { wsRoot } = getDWorkspace();
          const contents = await fs.readFile(path.join(wsRoot, ".gitignore"), {
            encoding: "utf-8",
          });
          expect(contents.match(/^vault1$/m)).toBeFalsy();
        });

        test("THEN updates config", async () => {
          const { wsRoot } = getDWorkspace();
          const config = DConfig.getRaw(wsRoot);
          expect(config.vaults![0].remote).toBeFalsy();
        });

        test("THEN the folder is NOT a git repository", async () => {
          const { wsRoot, vaults } = getDWorkspace();
          const git = new Git({
            localUrl: path.join(wsRoot, vaults[0].fsPath),
          });
          expect(await git.getUpstream()).toBeFalsy();
        });
      });
    }
  );
});
