import { PodExportScope, PodUtils } from "@dendronhq/pods-core";
import { describe } from "mocha";
import * as vscode from "vscode";
import { expect, getNoteFromTextEditor } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import { AirtableExportPodCommand } from "../../../../commands/pods/AirtableExportPodCommand";
import { ExtensionProvider } from "../../../../ExtensionProvider";
import fs from "fs-extra";
import { vault2Path } from "@dendronhq/common-server";
import path from "path";
import { VSCodeUtils } from "../../../../vsCodeUtils";
import { DendronError, DVault, ErrorFactory } from "@dendronhq/common-all";

suite("AirtableExportCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });
  const setUpPod = (opts: { wsRoot: string; vaults: DVault[] }) => {
    const { wsRoot, vaults } = opts;
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
    return { notePath, config };
  };

  describe("GIVEN AirtableExportPodCommand is run with Note scope", () => {
    const cmd = new AirtableExportPodCommand();
    describeSingleWS(
      "WHEN note is succesfully exported",
      {
        ctx,
      },
      () => {
        test("THEN metadata file should be updated", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const { notePath, config } = setUpPod({ wsRoot, vaults });
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
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
          const filePath = PodUtils.getPodMetadataJsonFilePath({
            wsRoot,
            vault: vaults[0],
            podId: payload?.config.podId,
          });
          expect(fs.pathExistsSync(filePath)).toBeTruthy();
          const data = PodUtils.readMetadataFromFilepath(filePath);
          expect(data.length).toEqual(1);
          expect(data[0].airtableId).toEqual(airtableId);
          expect(data[0].dendronId).toEqual(DendronId);
        });
      }
    );
    describeSingleWS(
      "AND WHEN there is an error in response",
      {
        ctx,
      },
      () => {
        test("THEN metadata file should not be updated", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const { notePath, config } = setUpPod({ wsRoot, vaults });
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
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
          const filePath = PodUtils.getPodMetadataJsonFilePath({
            wsRoot,
            vault: vaults[0],
            podId: payload?.config.podId,
          });
          const data = PodUtils.readMetadataFromFilepath(filePath);
          expect(data).toEqual([]);
          expect(resp).toEqual(
            `Finished Airtable Export. 0 records created; 0 records updated. Error encountered: ${ErrorFactory.safeStringify(
              result.error
            )}`
          );
        });
      }
    );
  });
});
