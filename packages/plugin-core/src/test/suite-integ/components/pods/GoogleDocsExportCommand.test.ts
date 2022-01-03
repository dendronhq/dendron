import { PodExportScope } from "@dendronhq/pods-core";
import { describe } from "mocha";
import * as vscode from "vscode";
import { expect } from "../../../testUtilsv2";
import { describeSingleWS, setupBeforeAfter } from "../../../testUtilsV3";
import { DendronError, ErrorFactory } from "@dendronhq/common-all";
import { GoogleDocsExportPodCommand } from "../../../../commands/pods/GoogleDocsExportPodCommand";

suite("GoogleDocsExportPodCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("GIVEN a GoogleDocsExportPodCommand is ran with Selection scope", () => {
    describeSingleWS(
      "WHEN there is an error in response",
      {
        ctx,
      },
      () => {
        const cmd = new GoogleDocsExportPodCommand();

        test("THEN error message must contain the error", async () => {
          const payload = await cmd.enrichInputs({
            exportScope: PodExportScope.Selection,
            accessToken: "test",
            refreshToken: "test",
            expirationTime: 1234,
            connectionId: "gdoc",
          });
          const result = {
            data: {
              created: [],
              updated: [],
            },
            error: new DendronError({
              status: "401",
              message: "Request failed with status code 401",
            }),
          };
          const resp = await cmd.onExportComplete({
            exportReturnValue: result,
            payload: payload?.payload!,
            config: payload?.config!,
          });
          expect(resp).toEqual(
            `Finished GoogleDocs Export. 0 docs created; 0 docs updated. Error encountered: ${ErrorFactory.safeStringify(
              result.error
            )}`
          );
        });
      }
    );
  });
});
