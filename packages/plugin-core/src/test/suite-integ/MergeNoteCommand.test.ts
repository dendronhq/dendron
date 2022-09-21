import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { describe } from "mocha";
import { MergeNoteCommand } from "../../commands/MergeNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { describeMultiWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";

suite("MergeNote", function () {
  describe("GIVEN a source note with no backlinks", () => {
    describeMultiWS(
      "WHEN merged",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "source",
            wsRoot,
            vault: vaults[0],
            body: "Source body\n",
          });
          await NoteTestUtilsV4.createNote({
            fname: "dest",
            wsRoot,
            vault: vaults[0],
            body: "Dest body\n",
          });
        },
        timeout: 5e3,
      },
      () => {
        test("THEN source body is appended to dest, source is deleted, and changes are emitted", async () => {
          const extension = ExtensionProvider.getExtension();
          const cmd = new MergeNoteCommand(extension);
          const engine = extension.getEngine();
          const preRunSource = (await engine.getNote("source")).data;
          const preRunDest = (await engine.getNote("dest")).data;
          if (preRunSource && preRunDest) {
            await extension.wsUtils.openNote(preRunSource);
          } else {
            throw new Error("source and dest not found.");
          }

          const runOut = await cmd.run({
            dest: "dest",
            noConfirm: true,
          });

          const postRunSource = (await engine.getNote("source")).data;
          const postRunDest = (await engine.getNote("dest")).data;
          expect(postRunSource).toBeFalsy();
          expect(postRunDest).toBeTruthy();
          expect(postRunDest?.body).toEqual(
            "Dest body\n\n---\n\n# Source\n\nSource body\n"
          );

          expect(runOut?.changed.length).toEqual(3);
          expect(runOut?.changed.map((change) => change.status)).toEqual([
            "update", // dest updated
            "update", // root updated
            "delete", // source deleted
          ]);
        });
      }
    );
  });
  describe("GIVEN a source note with backlinks", () => {
    describeMultiWS(
      "WHEN merged",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            fname: "source",
            wsRoot,
            vault: vaults[0],
            body: "Source body\n",
          });
          await NoteTestUtilsV4.createNote({
            fname: "dest",
            wsRoot,
            vault: vaults[0],
            body: "Dest body\n",
          });
          await NoteTestUtilsV4.createNote({
            fname: "ref",
            wsRoot,
            vault: vaults[0],
            body: "[[source]]\n[[dendron://vault1/source]]\n![[source]]\n![[dendron://vault1/source]]",
          });
        },
        timeout: 5e3,
      },
      () => {
        test("THEN source body is appended to dest, source is deleted, and changes are emitted", async () => {
          const extension = ExtensionProvider.getExtension();
          const cmd = new MergeNoteCommand(extension);
          const engine = extension.getEngine();
          const preRunSource = (await engine.getNote("source")).data;
          const preRunDest = (await engine.getNote("dest")).data;
          const preRunRef = (await engine.getNote("ref")).data;
          if (preRunSource && preRunDest && preRunRef) {
            await extension.wsUtils.openNote(preRunSource);
          } else {
            throw new Error("Note(s) not found.");
          }

          const runOut = await cmd.run({
            dest: "dest",
            noConfirm: true,
          });

          const postRunSource = (await engine.getNote("source")).data;
          const postRunDest = (await engine.getNote("dest")).data;
          const postRunRef = (await engine.getNote("ref")).data;
          expect(postRunSource).toBeFalsy();
          expect(postRunDest).toBeTruthy();
          expect(postRunDest?.body).toEqual(
            "Dest body\n\n---\n\n# Source\n\nSource body\n"
          );
          expect(postRunRef?.body).toEqual(
            "[[dest]]\n[[dendron://vault1/dest]]\n![[dest]]\n![[dendron://vault1/dest]]"
          );

          expect(runOut?.changed.length).toEqual(12);
          expect(runOut?.changed.map((change) => change.status)).toEqual([
            "update", // dest updated
            "update", // dest updated
            "update", // dest updated
            "update", // dest updated
            "update", // dest updated
            "update", // source updated
            "update", // source updated
            "update", // source updated
            "update", // source updated
            "update", // ref updated
            "update", // root updated
            "delete", // source deleted
          ]);
        });
      }
    );
  });
});
