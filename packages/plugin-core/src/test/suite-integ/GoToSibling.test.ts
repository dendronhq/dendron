import { DVault, NoteUtils } from "@dendronhq/common-all";
import { note2File, vault2Path } from "@dendronhq/common-server";
import { runJestHarnessV2 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { GoToSiblingCommand } from "../../commands/GoToSiblingCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("GoToSibling", function () {
  let ctx: vscode.ExtensionContext;
  const direction = "next" as const;

  ctx = setupBeforeAfter(this, {});

  const createNotes = (wsRoot: string, vault: DVault) => {
    return Promise.all([
      note2File({
        note: NoteUtils.create({ fname: "foo.journal.2020.08.29", vault }),
        vault,
        wsRoot,
      }),
      note2File({
        note: NoteUtils.create({ fname: "foo.journal.2020.08.30", vault }),
        vault,
        wsRoot,
      }),
      note2File({
        note: NoteUtils.create({ fname: "foo.journal.2020.08.31", vault }),
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
              actual:
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
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
          note: NoteUtils.create({ fname: "foo.journal.2020.08", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2020.09", vault }),
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
              actual:
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
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

  test("numeric siblings sort correctly", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.3", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.29", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.30", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "foo.journal.2021.04.29.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await new GoToSiblingCommand().execute({ direction });
        expect(resp).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.30.md"
          )
        ).toBeTruthy();

        done();
      },
    });
  });

  test("numeric and alphabetic siblings", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.3", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.zlob", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.29", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.baz", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.300", vault }),
          vault,
          wsRoot,
        });
        await note2File({
          note: NoteUtils.create({ fname: "foo.journal.2021.04.bar", vault }),
          vault,
          wsRoot,
        });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ wsRoot, vault });

        const notePath = path.join(vpath, "foo.journal.2021.04.300.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));

        const resp1 = await new GoToSiblingCommand().execute({ direction });
        expect(resp1).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.bar.md"
          )
        ).toBeTruthy();

        const resp2 = await new GoToSiblingCommand().execute({ direction });
        expect(resp2).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.baz.md"
          )
        ).toBeTruthy();

        const resp3 = await new GoToSiblingCommand().execute({ direction });
        expect(resp3).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.zlob.md"
          )
        ).toBeTruthy();

        const resp4 = await new GoToSiblingCommand().execute({ direction });
        expect(resp4).toEqual({ msg: "ok" });
        expect(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "foo.journal.2021.04.3.md"
          )
        ).toBeTruthy();

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
          note: NoteUtils.create({ fname: "foo.journal.2020.08.29", vault }),
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
              actual:
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
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
          note: NoteUtils.create({ fname: "foo.journal.2020.08.29", vault }),
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
          note: NoteUtils.create({ fname: "gamma", vault }),
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
              actual:
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
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

  test("nav in multi-root", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      postSetupHook: async ({ wsRoot, vaults }) => {
        await createNotes(wsRoot, vaults[0]);
        await createNotes(wsRoot, vaults[1]);
        await createNotes(wsRoot, vaults[2]);
      },
      onInit: async ({ vaults, wsRoot }) => {
        await _.reduce(
          vaults,
          async (prev, vault) => {
            await prev;
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
                  actual:
                    VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
                      (path.join(`${path.basename(vault.fsPath)}`, "foo.journal.2020.08.31.md"))
                    ),
                  expected: true,
                },
              ],
              expect
            );
          },
          Promise.resolve()
        );
        done();
      },
    });
  });
});
