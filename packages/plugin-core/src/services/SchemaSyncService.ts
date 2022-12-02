import _ from "lodash";
import { Logger } from "../logger";
import vscode, { Uri } from "vscode";
import { SchemaParser } from "@dendronhq/engine-server";
import path from "path";
import { VSCodeUtils } from "../vsCodeUtils";
import { ISchemaSyncService } from "./SchemaSyncServiceInterface";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WriteSchemaResp } from "@dendronhq/common-all";

/** Currently responsible for keeping the engine in sync with schema
 *  changes on disk. */
export class SchemaSyncService implements ISchemaSyncService {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  async onDidSave({ document }: { document: vscode.TextDocument }) {
    const uri = document.uri;

    Logger.info({
      ctx: "SchemaSyncService:onDidChange",
      msg: "updating schema",
    });

    await this.saveSchema({ uri });
  }

  async saveSchema({
    uri,
    isBrandNewFile,
  }: {
    uri: Uri;
    isBrandNewFile?: boolean;
  }): Promise<WriteSchemaResp[] | undefined> {
    const schemaParser = new SchemaParser({
      wsRoot: this.extension.getDWorkspace().wsRoot,
      logger: Logger,
    });
    const engineClient = this.extension.getDWorkspace().engine;

    const parsedSchema = await schemaParser.parse(
      [path.basename(uri.fsPath)],
      await this.extension.wsUtils.getVaultFromUri(uri)
    );

    if (_.isEmpty(parsedSchema.errors)) {
      const resp = await Promise.all(
        _.map(parsedSchema.schemas, async (schema) => {
          return engineClient.writeSchema(schema, { metaOnly: true });
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
      return resp;
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
      return;
    }
  }
}
