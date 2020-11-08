import { DirResult, tmpDir } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NodeTestUtilsV2,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RefactorHierarchyCommandV2 } from "../../commands/RefactorHierarchyV2";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";
import fs from "fs-extra";
import _ from "lodash";

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

  test("basic", (done) => {
    let acc = 0;
    VSCodeUtils.showInputBox = async () => {
      if (acc == 0) {
        acc += 1;
        return "refactor";
      } else {
        return "bond";
      }
    };
    // @ts-ignore
    VSCodeUtils.showQuickPick = async () => {
      return "proceed";
    };
    onWSInit(async () => {
      const resp = await new RefactorHierarchyCommandV2().run();
      assert.strictEqual(resp.changed.length, 6);
      const notes = fs.readdirSync(vaultDir);
      const exist = ["bond.md", "bond.one.md", "bond.two.md"];
      const notExist = ["refactor.md", "refactor.one.md", "refactor.two.md"];
      const out = _.intersection(notes, exist);
      const out2 = _.intersection(notes, notExist);
      assert.strictEqual(out.length, 3);
      assert.strictEqual(out2.length, 0);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (_vaultDir) => {
        vaultDir = _vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        await NodeTestUtilsV2.createNote({
          vaultDir,
          noteProps: {
            fname: "refactor",
            body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
          },
        });
        await NodeTestUtilsV2.createNote({
          vaultDir,
          noteProps: {
            fname: "refactor",
            body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
          },
        });
        await NodeTestUtilsV2.createNote({
          vaultDir,
          noteProps: {
            fname: "refactor.one",
            body: ["- [[refactor.two]]"].join("\n"),
          },
        });
        await NodeTestUtilsV2.createNote({
          vaultDir,
          noteProps: {
            fname: "refactor.two",
            body: [""].join("\n"),
          },
        });
      },
    });
  });
});
