import { DVault, NoteUtilsV2 } from "@dendronhq/common-all";
import { note2File, vault2Path } from "@dendronhq/common-server";
import { runJestHarnessV2 } from "@dendronhq/common-test-utils";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest } from "../testUtilsV3";

suite("notes", function () {
  let ctx: vscode.ExtensionContext;
  let direction = "next" as const;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  const createNotes = (wsRoot: string, vault: DVault) => {
    return Promise.all([
      note2File({
        note: NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
        vault,
        wsRoot,
      }),
      note2File({
        note: NoteUtilsV2.create({ fname: "foo.journal.2020.08.30", vault }),
        vault,
        wsRoot,
      }),
      note2File({
        note: NoteUtilsV2.create({ fname: "foo.journal.2020.08.31", vault }),
        vault,
        wsRoot,
      }),
    ]);
  };

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await createNotes(wsRoot, vaults[0]);
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });
        const notePath = path.join(vpath, "foo.journal.2020.08.30.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "ok" },
            },
            {
              actual: VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
                "foo.journal.2020.08.31.md"
              ),
              expected: true,
            },
          ],
          expect
        );
        done();
      },
    });
  });

  test("traversal from parent", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await createNotes(wsRoot, vault);
        await note2File({
          note: NoteUtilsV2.create({ fname: "foo.journal.2020.08", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtilsV2.create({ fname: "foo.journal.2020.09", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "foo.journal.2020.08.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "ok" },
            },
            {
              actual: VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
                "foo.journal.2020.09.md"
              ),
              expected: true,
            },
          ],
          expect
        );
        done();
      },
    });
  });

  test("go over index", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await createNotes(wsRoot, vault);
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "foo.journal.2020.08.31.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "ok" },
            },
            VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
              "foo.journal.2020.08.29.md"
            ),
          ],
          expect
        );
        done();
      },
    });
  });

  test("no siblings", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await note2File({
          note: NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "foo.journal.2020.08.29.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "no_siblings" },
            },
            {
              actual: VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
                "foo.journal.2020.08.29.md"
              ),
              expected: true,
            },
          ],
          expect
        );
        done();
      },
    });
  });

  test("no open editor", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await note2File({
          note: NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({}) => {
        await VSCodeUtils.closeAllEditors();
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "no_editor" },
            },
          ],
          expect
        );
        done();
      },
    });
  });

  test("nav in root", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await note2File({
          note: NoteUtilsV2.create({ fname: "gamma", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "root.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        await runJestHarnessV2(
          [
            {
              actual: resp,
              expected: { msg: "ok" },
            },
            {
              actual: VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
                "gamma.md"
              ),
              expected: true,
            },
          ],
          expect
        );
        done();
      },
    });
  });
});
