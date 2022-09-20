import { ERROR_STATUS } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { FileTestUtils } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { PasteFileCommand } from "../../commands/PasteFile";
import { clipboard } from "../../utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("PasteFile", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});

  test("no active editor", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({}) => {
        await VSCodeUtils.closeAllEditors();
        const resp = await new PasteFileCommand().execute({
          filePath: "foobar",
        });
        expect(resp?.error?.status).toEqual(ERROR_STATUS.INVALID_STATE);
        done();
      },
    });
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine, wsRoot }) => {
        const tmpRoot = FileTestUtils.tmpDir().name;
        const fakeAsset = path.join(tmpRoot, "apples.pdf");
        fs.writeFileSync(fakeAsset, "data");
        clipboard.writeText(fakeAsset);
        const note = (await engine.getNoteMeta("foo")).data!;
        const editor = await WSUtils.openNote(note);
        editor.selection = new vscode.Selection(8, 0, 8, 12);

        // run cmd
        await new PasteFileCommand().run();

        const dstPath = path.join(
          vault2Path({ vault: note.vault, wsRoot }),
          "assets",
          "apples.pdf"
        );
        expect(fs.existsSync(dstPath)).toBeTruthy();
        expect(fs.readFileSync(dstPath, { encoding: "utf8" })).toEqual("data");
        editor.selection = new vscode.Selection(8, 0, 8, 12);
        const pos1 = new vscode.Position(7, 0);
        const pos2 = new vscode.Position(7, 43);
        expect(editor.document.getText(new vscode.Range(pos1, pos2))).toEqual(
          `foo body[apples.pdf](${path.join("assets", "apples.pdf")})`
        );
        done();
      },
    });
  });

  test("with space in file name", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine, wsRoot }) => {
        const tmpRoot = FileTestUtils.tmpDir().name;
        const fname = "red apples~";
        const fakeAsset = path.join(tmpRoot, `${fname}.pdf`);
        fs.writeFileSync(fakeAsset, "data");
        clipboard.writeText(fakeAsset);
        const note = (await engine.getNoteMeta("foo")).data!;
        const editor = await WSUtils.openNote(note);
        editor.selection = new vscode.Selection(8, 0, 8, 12);

        // run cmd
        await new PasteFileCommand().run();
        const cleanFileName = _.kebabCase(fname) + ".pdf";
        const dstPath = path.join(
          vault2Path({ vault: note.vault, wsRoot }),
          "assets",
          cleanFileName
        );
        expect(fs.existsSync(dstPath)).toBeTruthy();
        expect(fs.readFileSync(dstPath, { encoding: "utf8" })).toEqual("data");
        editor.selection = new vscode.Selection(8, 0, 8, 12);
        const pos1 = new vscode.Position(7, 0);
        const pos2 = new vscode.Position(7, 50);
        expect(editor.document.getText(new vscode.Range(pos1, pos2))).toEqual(
          `foo body[red-apples.pdf](${path.join("assets", cleanFileName)})`
        );
        done();
      },
    });
  });
});
