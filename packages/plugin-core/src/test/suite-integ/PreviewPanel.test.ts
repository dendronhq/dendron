import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe, test, before } from "mocha";
import { PreviewPanelFactory } from "../../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect } from "../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../testUtilsV3";
import path from "path";
import { PreviewPanel } from "../../components/views/PreviewPanel";

async function makeTestNote({
  previewPanel,
  body,
  genRandomId = true,
}: {
  previewPanel: PreviewPanel;
  body: string;
  genRandomId?: boolean;
}): Promise<NoteProps> {
  const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
  const note = await NoteTestUtilsV4.createNoteWithEngine({
    engine,
    wsRoot,
    genRandomId,
    vault: vaults[0],
    fname: "preview-test-image",
    body,
  });
  const { rewriteImageUrls, panel } =
    previewPanel.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
  expect(panel).toBeTruthy();
  const newNote = rewriteImageUrls(note, panel!);
  // The function shouldn't modify the existing note
  expect(newNote !== note).toBeTruthy();
  return newNote;
}

suite("GIVEN PreviewPanel", function () {
  const ctx = setupBeforeAfter(this);

  describeSingleWS(
    "WHEN opening a note with images",
    {
      ctx,
    },
    () => {
      let previewPanel: PreviewPanel;
      before(async () => {
        const { engine, vaults } = ExtensionProvider.getDWorkspace();
        const note = await NoteUtils.getNoteByFnameFromEngine({
          fname: "root",
          vault: vaults[0],
          engine,
        });
        expect(note).toBeTruthy();
        await ExtensionProvider.getWSUtils().openNote(note!);
        previewPanel = PreviewPanelFactory.create(
          ExtensionProvider.getExtension()
        ) as PreviewPanel; // overriding the type here to get the function to expose internals
        await previewPanel.show(note);
      });

      describe("AND image starts with a forward slash", () => {
        test("THEN URL is correctly rewritten", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
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
          const { vaults } = ExtensionProvider.getDWorkspace();
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
          const { vaults } = ExtensionProvider.getDWorkspace();
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
                path.join(
                  VaultUtils.getRelPath(vaults[0]),
                  "assets",
                  "image.png"
                ),
              ],
            })
          ).toBeTruthy();
        });
      });
    }
  );
});
