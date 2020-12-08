import { vault2Path } from "@dendronhq/common-server";
import { FileTestUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RefactorHierarchyCommandV2 } from "../../commands/RefactorHierarchyV2";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("RefactorHiearchy", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor",
          body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor.one",
          body: ["- [[refactor.two]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor.two",
          body: [""].join("\n"),
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
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
        const resp = await new RefactorHierarchyCommandV2().run();
        assert.strictEqual(resp.changed.length, 6);
        const vault = vaults[0];
        const vpath = vault2Path({ vault, wsRoot });
        const notes = fs.readdirSync(vpath);
        const exist = ["bond.md", "bond.one.md", "bond.two.md"];
        const notExist = ["refactor.md", "refactor.one.md", "refactor.two.md"];
        const out = _.intersection(notes, exist);
        const out2 = _.intersection(notes, notExist);
        assert.strictEqual(out.length, 3);
        assert.strictEqual(out2.length, 0);
        done();
      },
    });
  });

  test("multi", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          vault: vault2,
          wsRoot,
          fname: "refactor",
          body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          vault: vault1,
          wsRoot,
          fname: "refactor.one",
          body: ["- [[refactor.two]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          vault: vault1,
          wsRoot,
          fname: "refactor.two",
          body: [""].join("\n"),
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
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
        const resp = await new RefactorHierarchyCommandV2().run();

        expect(resp.changed.length).toEqual(6);

        const vault1 = vaults[0];
        const vault2 = vaults[1];
        expect(
          await FileTestUtils.assertInVault({
            vault: vault1,
            wsRoot,
            match: ["bond.one.md", "bond.two.md"],
            nomatch: ["bond.md"],
          })
        ).toBeTruthy();
        expect(
          await FileTestUtils.assertInVault({
            vault: vault2,
            wsRoot,
            nomatch: ["bond.one.md", "bond.two.md"],
            match: ["bond.md"],
          })
        ).toBeTruthy();
        done();
      },
    });
  });
});
