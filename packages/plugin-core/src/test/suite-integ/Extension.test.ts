import { WorkspaceOpts } from "@dendronhq/common-all";
import { readYAML, tmpDir } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import path from "path";
import sinon from "sinon";
import vscode, { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { SetupWorkspaceOpts } from "../../commands/SetupWorkspace";
import {
  DEFAULT_LEGACY_VAULT_NAME,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
} from "../../constants";
import { isVSCodeTelemetryEnabled } from "../../telemetry";
import { DendronWorkspace, getWS } from "../../workspace";
import { _activate } from "../../_extension";
import {
  expect,
  genEmptyWSFiles,
  resetCodeWorkspace,
  stubWorkspaceFile,
} from "../testUtilsv2";
import { setupBeforeAfter, stubSetupWorkspace } from "../testUtilsV3";

async function initWorkspace(
  opts: {
    firstWs: boolean;
    previousVersion?: string;
    currentVersion: string;
  } & WorkspaceOpts,
  cb: () => Promise<any>
) {
  const { firstWs, previousVersion, currentVersion, wsRoot, vaults } =
    _.defaults(opts);
  const ws = getWS();
  await ws.context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, firstWs);
  await ws.context.globalState.update(GLOBAL_STATE.VERSION, previousVersion);
  sinon.stub(DendronWorkspace, "version").returns(currentVersion);
  sinon.stub(DendronWorkspace, "isActive").returns(true);
  stubWorkspaceFile(wsRoot);
  await WorkspaceService.createWorkspace({ wsRoot, vaults });
  await cb();
}

suite("Extension", function () {
  let ctx: ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
    },
    afterHook: async () => {
      sinon.restore();
    },
  });

  describe("setup workspace", function () {
    it("not active", function (done) {
      _activate(ctx).then((resp) => {
        expect(resp).toBeFalsy();
        done();
      });
    });

    it("not active, initial create ws", function (done) {
      const wsRoot = tmpDir().name;
      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, true)
        .then(() => {
          _activate(ctx).then(async () => {
            stubSetupWorkspace({
              wsRoot,
            });
            await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
              skipOpenWs: true,
              skipConfirmation: true,
            } as SetupWorkspaceOpts);
            const resp = readYAML(path.join(wsRoot, "dendron.yml"));
            expect(resp).toEqual({
              version: 1,
              vaults: [
                {
                  fsPath: "vault",
                },
              ],
              useFMTitle: true,
              useNoteTitleForLink: true,
              dayOfWeek: 1,
              initializeRemoteVaults: true,
              journal: {
                addBehavior: "childOfDomain",
                dailyDomain: "daily",
                dateFormat: "y.MM.dd",
                name: "journal",
              },
              noAutoCreateOnDefinition: true,
              noLegacyNoteRef: true,
              noXVaultWikiLink: true,
              lookupConfirmVaultOnCreate: false,
              site: {
                copyAssets: true,
                siteHierarchies: ["root"],
                siteRootDir: "docs",
                usePrettyRefs: true,
                title: "Dendron",
                description: "Personal knowledge space",
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: ["vault"],
                },
              },
            });
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genEmptyWSFiles());
            done();
          });
        });
    });

    // TODO: need to stub workspace with workspace file
    it.skip("active, need to wipe ws cache", function (done) {
      const wsRoot = tmpDir().name;
      const vaults = [{ fsPath: "vault1" }];
      initWorkspace(
        {
          firstWs: false,
          previousVersion: "0.45.3",
          currentVersion: "0.46.0",
          wsRoot,
          vaults,
        },
        async () => {
          _activate(ctx).then(async () => {
            done();
          });
        }
      );
    });

    // TODO: stub the vauls
    // it("active, remote vaults present", function (done) {
    //   const wsRoot = tmpDir().name;
    //   getWS()
    //     .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
    //     .then(() => {
    //       stubWorkspaceFile(wsRoot);
    //       // add remote vault
    //       const config = DConfig.getOrCreate(wsRoot);
    //       config.vaults.push(DENDRON_REMOTE_VAULT);
    //       writeConfig({ config, wsRoot });
    //       _activate(ctx).then(async () => {
    //         const rVaultPath = vault2Path({
    //           vault: DENDRON_REMOTE_VAULT,
    //           wsRoot,
    //         });
    //         expect(GitUtils.isRepo(rVaultPath)).toBeTruthy();
    //         done();
    //       });
    //     });
    // });
  });

  describe("telemetry", () => {
    test("can get VSCode telemetry settings", (done) => {
      // Just checking that we get some expected result, and that it doesn't just crash.
      const result = isVSCodeTelemetryEnabled();
      expect(
        result === true || result === false || result === undefined
      ).toBeTruthy();
      done();
    });
  });
});
