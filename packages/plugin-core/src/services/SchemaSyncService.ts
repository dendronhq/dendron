import _ from "lodash";
import { Logger } from "../logger";
import vscode from "vscode";
import { SchemaParser } from "@dendronhq/engine-server";
import { getDWorkspace, getVaultFromUri } from "../workspace";
import path from "path";

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
    Logger.info({
      ctx: "SchemaSyncService:onDidChange",
      msg: "updating schema.",
    });

    const schemaParser = new SchemaParser({
      wsRoot: getDWorkspace().wsRoot,
      logger: Logger,
    });
    const uri = document.uri;
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

      vscode.window.showInformationMessage(
        `Updated schemas in '${path.basename(document.fileName)}'`
      );
    } else {
      // TODO: will need 2nd pass once https://github.com/dendronhq/dendron/pull/1631 is merged
      // to make sure error messages look nice right now the details will be a JSON dump of
      // error, which is still could be helpful to the user but it will not be formatted very nice.
      vscode.window.showErrorMessage(
        `Failed to update '${path.basename(
          document.fileName
        )}'. Details: '${JSON.stringify(parsedSchema.errors)}'`
      );
    }
  }
}
