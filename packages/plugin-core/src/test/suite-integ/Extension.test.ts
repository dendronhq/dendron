import _ from "lodash";
import { readJSONWithComments, tmpDir } from "@dendronhq/common-server";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, it } from "mocha";
import path from "path";
import vscode, { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  InitializeType,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import {
  DEFAULT_LEGACY_VAULT_NAME,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
} from "../../constants";
import { HistoryService } from "../../services/HistoryService";
import { WorkspaceSettings } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { _activate } from "../../_extension";
import {
  expect,
  genEmptyWSFiles,
  genTutorialWSFiles,
  resetCodeWorkspace,
} from "../testUtilsv2";
import { setupLegacyWorkspaceMulti, stubSetupWorkspace } from "../testUtilsV3";

const TIMEOUT = 60 * 1000 * 5;

suite("Extension", function () {
  let ctx: ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(async function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
    await resetCodeWorkspace();
    await new ResetConfigCommand().execute({ scope: "all" });
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("setup workspace/ active", function () {
    test("remove bad extension", function (done) {
      setupLegacyWorkspaceMulti({
        ctx,
        wsSettingsOverride: {
          extensions: {
            recommendations: ["foo", "dendron.dendron-markdown-notes"],
            unwantedRecommendations: [],
          },
        },
      }).then(async () => {
        await _activate(ctx);
        const out = (await readJSONWithComments(
          DendronWorkspace.workspaceFile().fsPath
        )) as WorkspaceSettings;
        expect(
          _.find(
            out.extensions.recommendations,
            (ent) => ent === "dendron.dendron-markdown-notes"
          )
        ).toBeFalsy();
        expect(
          _.find(
            out.extensions.unwantedRecommendations,
            (ent) => ent === "dendron.dendron-markdown-notes"
          )
        ).toBeTruthy();
        done();
      });
    });
  });

  describe("setup workspace", function () {
    it("not active", function (done) {
      _activate(ctx).then((resp) => {
        expect(resp).toBeFalsy();
        done();
      });
    });

    it("not active/ init, first time", function (done) {
      const wsRoot = tmpDir().name;
      _activate(ctx).then(async (resp) => {
        expect(resp).toBeFalsy();
        stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
        await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
          skipOpenWs: true,
          skipConfirmation: true,
        } as SetupWorkspaceOpts);

        // first time init
        expect(
          fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
        ).toEqual(genTutorialWSFiles());
        done();
      });
    });

    it("not active/ init, not first time", function (done) {
      const wsRoot = tmpDir().name;
      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
        .then(() => {
          _activate(ctx).then(async (resp) => {
            expect(resp).toBeFalsy();
            stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
            await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
              skipOpenWs: true,
              skipConfirmation: true,
            } as SetupWorkspaceOpts);

            // first time init
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genEmptyWSFiles());
            done();
          });
        });
    });
  });

  describe.skip("setup workspace v2", function () {
    it("not active/ init", function (done) {
      const wsRoot = tmpDir().name;
      _activate(ctx).then(async (resp) => {
        expect(resp).toBeFalsy();
        stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
        await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS_V2.key, {
          skipOpenWs: true,
          skipConfirmation: true,
        } as SetupWorkspaceOpts);
        expect(fs.readdirSync(wsRoot)).toEqual([
          "dendron",
          "docs",
          "vault-main",
        ]);
        done();
      });
    });
  });
});
