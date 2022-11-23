import { PodExportScope } from "@dendronhq/pods-core";
import { describe } from "mocha";
import * as vscode from "vscode";
import { expect, getNoteFromTextEditor } from "../../../testUtilsv2";
import { describeSingleWS } from "../../../testUtilsV3";
import { AirtableExportPodCommand } from "../../../../commands/pods/AirtableExportPodCommand";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import { vault2Path } from "@dendronhq/common-server";
import path from "path";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { DendronError, ErrorFactory } from "@dendronhq/common-all";

suite("AirtableExportCommand", function () {
  const setUpPod = async () => {
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const notePath = path.join(
      vault2Path({ vault: vaults[0], wsRoot }),
      "root.md"
    );
    const config = {
      podId: "dendron.task",
      exportScope: PodExportScope.Note,
      apiKey: "fakeKey",
      baseId: "fakeBase",
      tableName: "fakeTable",
      sourceFieldMapping: {},
    };
    await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
    return { config };
  };

  describe("GIVEN AirtableExportPodCommand is run with Note scope with podId dendron.task", () => {
    describeSingleWS(
      "WHEN note is succesfully exported for the first time",
      {},
      () => {
        test("THEN note frontmatter should be updated with airtable metadata", async () => {
          const extension = ExtensionProvider.getExtension();
          const cmd = new AirtableExportPodCommand(extension);
          const { config } = await setUpPod();
          const note = getNoteFromTextEditor();
          const payload = await cmd.enrichInputs(config);
          const airtableId = "airtable-proj.beta";
          const DendronId = note.id;
          const result = {
            data: {
              created: [
                {
                  fields: {
                    DendronId,
                  },
                  id: airtableId,
                },
              ],
              updated: [],
            },
            error: null,
          };
          await cmd.onExportComplete({
            exportReturnValue: result as any,
            config: payload?.config!,
          });
          const n = getNoteFromTextEditor();
          expect(n?.custom.pods.airtable["dendron.task"]).toEqual(airtableId);
        });
      }
    );
    describeSingleWS(
      "WHEN note is already exported to a table before and is now exported to a new table",
      {},
      () => {
        test("THEN new airtable id should be appended in the note frontmatter", async () => {
          const extension = ExtensionProvider.getExtension();
          const cmd = new AirtableExportPodCommand(extension);
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;
          const { config } = await setUpPod();
          const note = getNoteFromTextEditor();
          note.custom = {
            pods: {
              airtable: {
                "dendron.test": "airtable-1",
              },
            },
          };
          note.vault = vaults[0];
          await engine.writeNote(note);
          const payload = await cmd.enrichInputs(config);
          const airtableId = "airtable-proj.beta";
          const DendronId = note.id;
          const result = {
            data: {
              created: [
                {
                  fields: {
                    DendronId,
                  },
                  id: airtableId,
                },
              ],
              updated: [],
            },
            error: null,
          };
          await cmd.onExportComplete({
            exportReturnValue: result as any,
            config: payload?.config!,
          });
          const n = getNoteFromTextEditor();
          expect(n?.custom.pods.airtable["dendron.task"]).toEqual(airtableId);
          expect(n?.custom.pods.airtable["dendron.test"]).toEqual("airtable-1");
        });
      }
    );
    describeSingleWS("AND WHEN there is an error in response", {}, () => {
      test("THEN error must be thrown", async () => {
        const extension = ExtensionProvider.getExtension();
        const cmd = new AirtableExportPodCommand(extension);
        const { config } = await setUpPod();
        const payload = await cmd.enrichInputs(config);
        const result = {
          data: {
            created: [],
            updated: [],
          },
          error: new DendronError({
            message: "Request failed with status code 422",
          }),
        };
        const resp = await cmd.onExportComplete({
          exportReturnValue: result as any,
          config: payload?.config!,
        });

        expect(resp).toEqual(
          `Finished Airtable Export. 0 records created; 0 records updated. Error encountered: ${ErrorFactory.safeStringify(
            result.error
          )}`
        );
      });
    });
  });
});
