import { DirResult, tmpDir } from "@dendronhq/common-server";
import {
  INIT_TEST_PRESETS,
  NodeTestPresetsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("re-create root files if missing", (done) => {
    onWSInit(async () => {
      const rootFiles = [
        path.join(vaultDir, "root.md"),
        path.join(vaultDir, "root.schema.yml"),
      ];
      rootFiles.map((ent) => fs.removeSync(ent));
      await new ReloadIndexCommand().run();
      assert.ok(_.every(rootFiles.map((ent) => fs.existsSync(ent))));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("don't overwrite if root exists", (done) => {
    onWSInit(async () => {
      const rootFiles = [
        path.join(vaultDir, "root.md"),
        path.join(vaultDir, "root.schema.yml"),
      ];
      fs.appendFileSync(rootFiles[0], "bond", { encoding: "utf8" });
      fs.appendFileSync(rootFiles[1], "# bond", { encoding: "utf8" });
      await new ReloadIndexCommand().run();
      assert.ok(
        _.every(
          rootFiles.map((ent) => fs.readFileSync(ent).indexOf("bond") >= 0)
        )
      );
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  // need to pass error
  test.skip("bad schema", (done) => {
    onWSInit(async () => {
      const engine = DendronWorkspace.instance().getEngine();
      const resp = await new ReloadIndexCommand().run();
      await NodeTestPresetsV2.runMochaHarness({
        opts: {
          engine,
          resp,
        },
        results: INIT_TEST_PRESETS.BAD_SCHEMA.results,
      });
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await INIT_TEST_PRESETS.BAD_SCHEMA.before({ vaultDir });
      },
    });
  });
});
