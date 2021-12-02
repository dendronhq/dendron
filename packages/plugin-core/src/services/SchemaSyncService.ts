import _ from "lodash";
import { Logger } from "../logger";
import vscode, { Uri } from "vscode";
import { SchemaParser } from "@dendronhq/engine-server";
import { getDWorkspace, getVaultFromUri } from "../workspace";
import path from "path";
import { VSCodeUtils } from "../vsCodeUtils";

let SCHEMA_SYNC_SERVICE: SchemaSyncService | undefined;

/** Currently responsible for keeping the engine in sync with schema
 *  changes on disk. */
export class SchemaSyncService {
  static instance() {
    if (_.isUndefined(SCHEMA_SYNC_SERVICE)) {
      SCHEMA_SYNC_SERVICE = new SchemaSyncService();
    }
    return SCHEMA_SYNC_SERVICE;
  }

  async onDidSave({ document }: { document: vscode.TextDocument }) {
    const uri = document.uri;

    Logger.info({
      ctx: "SchemaSyncService:onDidChange",
      msg: "updating schema.",
    });

    await this.saveSchema({ uri });
  }

  async saveSchema({
    uri,
    isBrandNewFile,
  }: {
    uri: Uri;
    isBrandNewFile?: boolean;
  }) {
    const schemaParser = new SchemaParser({
      wsRoot: getDWorkspace().wsRoot,
      logger: Logger,
    });
    const engineClient = getDWorkspace().engine;

    const parsedSchema = await schemaParser.parse(
      [path.basename(uri.fsPath)],
      getVaultFromUri(uri)
    );

    if (_.isEmpty(parsedSchema.errors)) {
      await Promise.all(
        _.map(parsedSchema.schemas, async (schema) => {
          await engineClient.updateSchema(schema);
        })
      );

      const msg = `${
        isBrandNewFile ? "Created" : "Updated"
      } schemas in '${path.basename(uri.fsPath)}'`;
      vscode.window.showInformationMessage(msg);

      // We are setting the status bar message when schemas are malformed to give user
      // data when the error message closes (if they use 'Go to schema' button) so we
      // should overwrite the status bar with a 'happy' message as well.
      vscode.window.setStatusBarMessage(msg);
    } else {
      const navigateButtonText = "Go to schema.";
      const msg = `Failed to update '${path.basename(
        uri.fsPath
      )}'. Details: ${parsedSchema.errors?.map((e) => e.message)}`;

      // If the user clicks on navigate button the error (including the reason) goes
      // away hence we should at least set the status to the reason. It is very
      // imperfect since status bar can be hidden, the message can overrun,
      // (or the user might not notice the status bar message altogether)
      // but its better than nothing.
      vscode.window.setStatusBarMessage(msg);

      const userAction = await vscode.window.showErrorMessage(
        msg,
        navigateButtonText
      );
      if (userAction === navigateButtonText) {
        await VSCodeUtils.openFileInEditor(uri);
      }
    }
  }
}
