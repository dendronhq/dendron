import { NoteProps, NotePropsMeta, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { before, beforeEach, describe, it } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import {
  PreviewLinkHandler,
  ShowPreviewAssetOpener,
} from "../../components/views/PreviewLinkHandler";
import { ExtensionProvider } from "../../ExtensionProvider";
import { QuickPickUtil } from "../../utils/quickPick";
import { VSCodeUtils } from "../../vsCodeUtils";
import { MockDendronExtension } from "../MockDendronExtension";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import fs from "fs-extra";
import { tmpDir } from "@dendronhq/common-server";
import _ from "lodash";
import { LinkType } from "../../components/views/IPreviewLinkHandler";

suite("PreviewLinkHandler", () => {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    noSetTimeout: true,
    beforeHook: () => {},
  });

  let testNoteAmbiguous: NoteProps;
  describeMultiWS(
    "GIVEN onLinkClicked",
    {
      ctx,
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "target",
          vault: vaults[0],
          wsRoot,
          body: [
            "Qui dicta nulla at atque qui voluptatem.",
            "Harum qui quasi sint.",
            "",
            "## Nostrum",
            "",
            "Ut recusandae fuga recusandae nihil.",
            "Illum nostrum id animi. ^nihil",
          ].join("\n"),
          props: {
            id: "test-id",
          },
        });
        await NoteTestUtilsV4.createNote({
          fname: "lorem",
          vault: vaults[0],
          wsRoot,
          body: "Est saepe ut et accusamus soluta id",
          props: {
            id: "est",
          },
        });
        testNoteAmbiguous = await NoteTestUtilsV4.createNote({
          fname: "lorem",
          vault: vaults[1],
          wsRoot,
          body: "Reprehenderit dolores pariatur",
          props: {
            id: "reprehenderit",
          },
        });
      },
    },
    () => {
      let note: NotePropsMeta;
      beforeEach(async () => {
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        note = (
          await engine.findNotesMeta({ fname: "root", vault: vaults[0] })
        )[0];
        expect(note).toBeTruthy();
        await ExtensionProvider.getWSUtils().openNote(note);
      });

      describe("WHEN clicking on an wikilink", () => {
        test("THEN the clicked note is opened", async () => {
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#nostrum",
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.WIKI);
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
              "target.md"
            )
          ).toBeTruthy();
        });

        describe("AND the link is to a header", () => {
          test("THEN the note is opened at that header", async () => {
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#nostrum",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.WIKI);
            expect(
              VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
                "target.md"
              )
            ).toBeTruthy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.selection.active.line
            ).toEqual(10);
          });
        });

        describe("AND the link is to a block anchor", () => {
          test("THEN the note is opened at that block", async () => {
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test-id#^nihil",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.WIKI);
            expect(
              VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
                "target.md"
              )
            ).toBeTruthy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.selection.active.line
            ).toEqual(13);
          });
        });

        describe("AND if the link is to a missing note", () => {
          test("THEN nothing happens", async () => {
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const openWithDefaultApp = sinon.stub(
              ShowPreviewAssetOpener,
              "openWithDefaultApp"
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/does-not-exist",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.UNKNOWN);
            expect(openWithDefaultApp.called).toBeFalsy();
          });
        });

        describe("AND the link is ambiguous", () => {
          test("THEN it prompts for a note", async () => {
            const showChooseNote = sinon
              .stub(QuickPickUtil, "showChooseNote")
              .returns(Promise.resolve(testNoteAmbiguous));
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/lorem",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.WIKI);
            expect(
              VSCodeUtils.getActiveTextEditor()
                ?.document.getText()
                .includes("Reprehenderit dolores pariatur")
            ).toBeTruthy();
            expect(showChooseNote.called).toBeTruthy();
          });
        });
      });

      describe("WHEN clicking on a web URL", () => {
        test("THEN opening is left to VSCode", async () => {
          const openWithDefaultApp = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: "https://wiki.dendron.so/#getting-started",
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.WEBSITE);
          expect(openWithDefaultApp.called).toBeFalsy();
        });
      });

      describe("WHEN clicking on an asset inside a vault", () => {
        before(async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const assetsPath = path.join(
            wsRoot,
            VaultUtils.getRelPath(vaults[0]),
            "assets"
          );
          await fs.mkdir(assetsPath);
          await fs.writeFile(path.join(assetsPath, "test.pdf"), "");
        });

        test("THEN it is opened with the default app", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const openWithDefaultApp = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/assets/test.pdf",
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.ASSET);
          expect(openWithDefaultApp.called).toBeTruthy();
          expect(
            openWithDefaultApp.calledWith(
              path.join(
                wsRoot,
                VaultUtils.getRelPath(vaults[0]),
                "assets",
                "test.pdf"
              )
            )
          ).toBeTruthy();
        });
      });

      describe("WHEN clicking on an asset with path relative to wsRoot", () => {
        before(async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          await fs.writeFile(path.join(wsRoot, "test.pdf"), "");
        });

        test("THEN it is opened with the default app", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const openWithDefaultApp = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.pdf",
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.ASSET);
          expect(openWithDefaultApp.called).toBeTruthy();
          expect(
            openWithDefaultApp.calledWith(path.join(wsRoot, "test.pdf"))
          ).toBeTruthy();
        });
      });

      describe("WHEN clicking on an asset with an absolute path", () => {
        let testDir: string;
        before(async () => {
          testDir = tmpDir().name;
          await fs.writeFile(path.join(testDir, "test.pdf"), "");
        });

        test("THEN it is opened with the default app", async () => {
          const openWithDefaultApp = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: `vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/${path.join(
                testDir,
                "test.pdf"
              )}`,
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.ASSET);
          expect(openWithDefaultApp.called).toBeTruthy();
          // Added the "toLowerCase"s here because on Windows link handler
          // gets called with C:\ while testDir is c:\
          expect(openWithDefaultApp.args[0][0].toLowerCase()).toEqual(
            path.join(testDir, "test.pdf").toLowerCase()
          );
        });
      });

      describe("WHEN opening a non-note text file", () => {
        before(async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          await fs.writeFile(
            path.join(wsRoot, "test.py"),
            [
              "print('hello world!')",
              "print('hello from a test')",
              "print('hi!') # ^target",
              "print('hey!!!')",
            ].join("\n")
          );
        });

        test("THEN it is opened in the editor", async () => {
          const openWithDefaultApp = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
          const handler = new PreviewLinkHandler(
            ExtensionProvider.getExtension()
          );
          const out = await handler.onLinkClicked({
            data: {
              href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py",
              id: note.id,
            },
          });
          expect(out).toEqual(LinkType.TEXT);
          expect(openWithDefaultApp.called).toBeFalsy();
          expect(
            VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
              "test.py"
            )
          ).toBeTruthy();
        });

        describe("AND the file link is to a line", () => {
          test("THEN it is opened at that line", async () => {
            const openWithDefaultApp = sinon.stub(
              ShowPreviewAssetOpener,
              "openWithDefaultApp"
            );
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py#L2",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.TEXT);
            expect(openWithDefaultApp.called).toBeFalsy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
                "test.py"
              )
            ).toBeTruthy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.selection.start.line
            ).toEqual(1);
          });
        });

        describe("AND the file link is to an anchor", () => {
          test("THEN it is opened at that anchor", async () => {
            const openWithDefaultApp = sinon.stub(
              ShowPreviewAssetOpener,
              "openWithDefaultApp"
            );
            const handler = new PreviewLinkHandler(
              ExtensionProvider.getExtension()
            );
            const out = await handler.onLinkClicked({
              data: {
                href: "vscode-webview://76b3da02-f902-4652-b6a8-746551d032ce/test.py#^target",
                id: note.id,
              },
            });
            expect(out).toEqual(LinkType.TEXT);
            expect(openWithDefaultApp.called).toBeFalsy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(
                "test.py"
              )
            ).toBeTruthy();
            expect(
              VSCodeUtils.getActiveTextEditor()?.selection.start.line
            ).toEqual(2);
          });
        });
      });
    }
  );

  describe(`extractNoteIdFromHref`, () => {
    describe(`WHEN id is present`, () => {
      it("AND with header anchor THEN extract id", () => {
        const linkHandler = new PreviewLinkHandler(
          new MockDendronExtension({})
        );
        const actual = linkHandler.extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0#heading-2",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND without the header anchor THEN extract id", () => {
        const linkHandler = new PreviewLinkHandler(
          new MockDendronExtension({})
        );

        const actual = linkHandler.extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND is guid like", () => {
        // This shouldnt typically happen with the way we currently generate ids but we do
        // have some guid like ids in our test workspace right now so to make those
        // notes happy, and in case some older id generation used guid looking identifers.

        const linkHandler = new PreviewLinkHandler(
          new MockDendronExtension({})
        );

        const actual = linkHandler.extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/56497553-c195-4ec8-bc74-6a76462d9333",
        });

        expect(actual).toEqual("56497553-c195-4ec8-bc74-6a76462d9333");
      });
    });

    it(`WHEN id not present in href THEN default onto passed in id`, () => {
      const linkHandler = new PreviewLinkHandler(new MockDendronExtension({}));

      const actual = linkHandler.extractNoteIdFromHref({
        id: "id1",
        href: "http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2",
      });
      expect(actual).toEqual("id1");
    });
  });
});
