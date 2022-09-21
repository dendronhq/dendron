import { VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { RenameNoteCommand } from "../../commands/RenameNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeMultiWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";

suite("RenameNoteCommand", function () {
  describeMultiWS("GIVEN note with invalid hierarchy", {}, () => {
    test("WHEN renamed to valid hierarchy THEN renamed properly", async () => {
      const extension = ExtensionProvider.getExtension();
      const { vaults, wsRoot } = extension.getDWorkspace();
      const engine = extension.getEngine();

      const invalidNote = await NoteTestUtilsV4.createNoteWithEngine({
        fname: ".foo",
        body: "invalid note body",
        vault: vaults[0],
        engine,
        wsRoot,
      });

      await NoteTestUtilsV4.createNoteWithEngine({
        fname: "some-note",
        body: "[[.foo]]",
        vault: vaults[0],
        wsRoot,
        engine,
      });
      await extension.wsUtils.openNote(invalidNote);
      const cmd = new RenameNoteCommand(extension);
      const vaultName = VaultUtils.getName(vaults[0]);
      const out = await cmd.execute({
        moves: [
          {
            oldLoc: {
              fname: invalidNote.fname,
              vaultName,
            },
            newLoc: {
              fname: "foo",
              vaultName,
            },
          },
        ],
        nonInteractive: true,
        initialValue: "foo",
      });

      // note `.foo` is renamed to `foo`, `some-note`'s reference to `.foo` is updated to `foo`
      expect(out.changed.length).toEqual(6);
      const foo = (
        await engine.findNotes({
          vault: vaults[0],
          fname: "foo",
        })
      )[0];
      expect(foo).toBeTruthy();

      const updatedSomeNote = (
        await engine.findNotes({
          vault: vaults[0],
          fname: "some-note",
        })
      )[0];
      expect(updatedSomeNote.body).toEqual("[[foo]]");
    });
  });
});
