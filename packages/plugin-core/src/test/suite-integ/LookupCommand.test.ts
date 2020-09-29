import {
  DirResult,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { LookupCommand } from "../../commands/LookupCommand";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("Lookup", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test.only("Lookup scratch note", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      const quickPick = await new LookupCommand().execute({
        selectionType: "selection2link",
        noteType: "journal",
      });
      // done();
    });

    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });

  test("Lookup scratch note", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      await new LookupCommand().execute({
        selectionType: "selection2link",
        noteType: "scratch",
      });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });

  test("Lookup selection2link", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      await new LookupCommand().execute({ selectionType: "selection2link" });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });
});
