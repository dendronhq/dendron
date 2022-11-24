import { NoteProps, VaultUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe, test, before } from "mocha";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";
import path from "path";
import { PreviewPanel } from "../../views/common/preview/PreviewPanel";

async function makeTestNote({
  previewPanel,
  body,
  genRandomId = true,
}: {
  previewPanel: PreviewPanel;
  body: string;
  genRandomId?: boolean;
}): Promise<NoteProps> {
  const ws = ExtensionProvider.getDWorkspace();
  const { engine, wsRoot } = ws;
  const vaults = await ws.vaults;
  const note = await NoteTestUtilsV4.createNoteWithEngine({
    engine,
    wsRoot,
    genRandomId,
    vault: vaults[0],
    fname: "preview-test-image",
    body,
  });
  const { rewriteImageUrls } =
    previewPanel.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
  const newNote = rewriteImageUrls(note);
  // The function shouldn't modify the existing note
  expect(newNote !== note).toBeTruthy();
  return newNote;
}

suite("GIVEN PreviewPanel", function () {
  describeSingleWS("WHEN opening a note", {}, () => {
    let previewPanel: PreviewPanel;
    before(async () => {
      const ws = ExtensionProvider.getDWorkspace();
      const { engine } = ws;
      const vaults = await ws.vaults;
      const note = (
        await engine.findNotes({ fname: "root", vault: vaults[0] })
      )[0];
      expect(note).toBeTruthy();
      await ExtensionProvider.getWSUtils().openNote(note!);
      previewPanel = PreviewPanelFactory.create() as PreviewPanel; // overriding the type here to get the function to expose internals
      previewPanel.show(note);
    });

    describe("AND note has block anchor", () => {
      test("Block anchor is not converted to plain text", async () => {
        const note = await makeTestNote({
          previewPanel,
          body: "Lorem ipsum ^anchor",
        });
        expect(
          await AssertUtils.assertInString({
            body: note.body,
            match: ["^anchor"],
          })
        ).toBeTruthy();
      });
    });

    describe("and note has images", () => {
      describe("AND image starts with a forward slash", () => {
        test("THEN URL is correctly rewritten", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const note = await makeTestNote({
            previewPanel,
            body: "![](/assets/image.png)",
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: [
                "https://file",
                "vscode",
                path.posix.join(
                  VaultUtils.getRelPath(vaults[0]),
                  "assets",
                  "image.png"
                ),
              ],
            })
          ).toBeTruthy();
        });
      });

      describe("AND image starts without a forward slash", () => {
        test("THEN URL is correctly rewritten", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const note = await makeTestNote({
            previewPanel,
            body: "![](assets/image.png)",
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: [
                "https://file",
                "vscode",
                path.posix.join(
                  VaultUtils.getRelPath(vaults[0]),
                  "assets",
                  "image.png"
                ),
              ],
            })
          ).toBeTruthy();
        });
      });

      describe("AND image URI is encoded", () => {
        test("THEN URL is correctly rewritten", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const note = await makeTestNote({
            previewPanel,
            body: "![](assets/Pasted%20image%20%CE%B1.png)",
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: [
                "https://file",
                "vscode",
                path.posix.join(
                  VaultUtils.getRelPath(vaults[0]),
                  "assets",
                  // `makeTestNote()` will invoke `rewriteImageUrls()`
                  //  in which `makeImageUrlFullPath()` will expectedly decode "Pasted%20image%20%CE%B1.png"
                  //    to "Pasted image α.png",
                  //  then `panel.webview.asWebviewUri` encodes it back to "Pasted%20image%20%CE%B1.png".
                  "Pasted%20image%20%CE%B1.png"
                ),
              ],
            })
          ).toBeTruthy();
        });
      });

      describe("AND image is an absolute path", () => {
        test("THEN URL is correctly rewritten", async () => {
          const { wsRoot } = ExtensionProvider.getDWorkspace();
          const note = await makeTestNote({
            previewPanel,
            body: `![](${path.join(wsRoot, "image.png").normalize()})`,
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: ["https://file", "vscode", "image.png"],
            })
          ).toBeTruthy();
        });
      });

      describe("AND image is a URL", () => {
        test("THEN URL is NOT rewritten", async () => {
          const note = await makeTestNote({
            previewPanel,
            body: `![](https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png)`,
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: [
                "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
              ],
              nomatch: ["vscode", "https://file"],
            })
          ).toBeTruthy();
        });
      });

      describe("AND the note is updated", () => {
        test("THEN the output also updates", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          let note = await makeTestNote({
            previewPanel,
            body: `![](https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png)`,
            genRandomId: false,
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              match: [
                "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
              ],
              nomatch: ["vscode", "https://file"],
            })
          ).toBeTruthy();
          // with genRandomId: false, the new note will have the same ID and will update the pervious one
          note = await makeTestNote({
            previewPanel,
            body: `![](/assets/image.png)`,
            genRandomId: false,
          });
          expect(
            await AssertUtils.assertInString({
              body: note.body,
              nomatch: [
                "https://org-dendron-public-assets.s3.amazonaws.com/images/rfc-35-template-1.png",
              ],
              match: [
                "https://file",
                "vscode",
                path.posix.join(
                  VaultUtils.getRelPath(vaults[0]),
                  "assets",
                  "image.png"
                ),
              ],
            })
          ).toBeTruthy();
        });
      });
    });
  });
});
