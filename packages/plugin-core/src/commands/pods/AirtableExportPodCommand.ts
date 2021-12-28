import Airtable, { FieldSet, Records } from "@dendronhq/airtable";
import { ErrorFactory, NoteProps, ResponseUtil } from "@dendronhq/common-all";
import {
  AirtableConnection,
  AirtableExportPodV2,
  AirtableExportReturnType,
  AirtableV2PodConfig,
  ConfigFileUtils,
  createRunnableAirtableV2PodConfigSchema,
  ExportPodV2,
  ExternalConnectionManager,
  ExternalService,
  isRunnableAirtableV2PodConfig,
  JSONSchemaType,
  PodV2Types,
  RunnableAirtableV2PodConfig,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { window } from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getEngine, getExtension } from "../../workspace";
import { BaseExportPodCommand } from "./BaseExportPodCommand";

/**
 * VSCode command for running the Airtable Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class AirtableExportPodCommand extends BaseExportPodCommand<
  RunnableAirtableV2PodConfig,
  AirtableExportReturnType
> {
  public key = "dendron.airtableexport";

  public constructor() {
    super(new QuickPickHierarchySelector());
  }

  public createPod(
    config: RunnableAirtableV2PodConfig
  ): ExportPodV2<AirtableExportReturnType> {
    return new AirtableExportPodV2({
      airtable: new Airtable({ apiKey: config.apiKey }),
      config,
      engine: ExtensionProvider.getEngine(),
    });
  }

  public getRunnableSchema(): JSONSchemaType<RunnableAirtableV2PodConfig> {
    return createRunnableAirtableV2PodConfigSchema();
  }

  async gatherInputs(
    opts?: Partial<AirtableV2PodConfig & AirtableConnection>
  ): Promise<RunnableAirtableV2PodConfig | undefined> {
    let apiKey: string | undefined = opts?.apiKey;
    let connectionId: string | undefined = opts?.connectionId;

    // Get an Airtable API Key
    if (!apiKey) {
      const mngr = new ExternalConnectionManager(getExtension().podsDir);

      // If the apiKey doesn't exist, see if we can first extract it from the connectedServiceId:
      if (opts?.connectionId) {
        const config = mngr.getConfigById<AirtableConnection>({
          id: opts.connectionId,
        });

        if (!config) {
          window.showErrorMessage(
            `Couldn't find service config with the passed in connection ID ${opts.connectionId}.`
          );
          return;
        }
        apiKey = config.apiKey;
      } else {
        // Prompt User to pick an airtable connection, or create a new one
        // (which will stop execution of current pod command)
        const connection =
          await PodUIControls.promptForExternalServiceConnectionOrNew<AirtableConnection>(
            ExternalService.Airtable
          );

        if (!connection) {
          return;
        }

        connectionId = connection.connectionId;
        apiKey = connection.apiKey;
      }
    }

    // Get the export scope
    const exportScope =
      opts && opts.exportScope
        ? opts.exportScope
        : await PodUIControls.promptForExportScope();

    if (!exportScope) {
      return;
    }

    // Get the airtable base to export to
    const baseId =
      opts && opts.baseId ? opts.baseId : await this.getAirtableBaseFromUser();

    // Get the airtable table name to export to
    const tableName =
      opts && opts.tableName ? opts.tableName : await this.getTableFromUser();

    // Currently, there's no UI outside of manually editing the config.yaml file
    // to specify the source field mapping
    const sourceFieldMapping = opts?.sourceFieldMapping ?? undefined;

    const inputs = {
      exportScope,
      tableName,
      sourceFieldMapping,
      ...opts,
      podType: PodV2Types.AirtableExportV2,
      apiKey,
      connectionId,
      baseId,
    };

    if (!isRunnableAirtableV2PodConfig(inputs)) {
      let id = inputs.podId;
      if (!id) {
        const picked = await PodUIControls.promptForGenericId();

        if (!picked) {
          return;
        }
        id = picked;
      }

      const configPath = ConfigFileUtils.genConfigFileV2({
        fPath: path.join(getExtension().podsDir, "custom", `config.${id}.yml`),
        configSchema: AirtableExportPodV2.config(),
        setProperties: _.merge(inputs, {
          podId: id,
          connectionId: inputs.connectionId,
        }),
      });

      await VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
      //TODO: Modify message:
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again."
      );
      return;
    } else {
      return inputs;
    }
  }

  /**
   * Upon finishing the export, add the airtable record ID back to the
   * corresponding note in Dendron, so that on future writes, we know how to
   * distinguish between whether a note export should create a new row in
   * Airtable or update an existing one.
   * @param exportReturnValue
   * @returns
   */
  public onExportComplete(opts: {
    exportReturnValue: AirtableExportReturnType;
    config: RunnableAirtableV2PodConfig;
    payload: string | NoteProps[];
  }): void {
    const { exportReturnValue } = opts;

    if (exportReturnValue.data?.created) {
      this.updateNotesWithAirtableId(exportReturnValue.data?.created);
    }

    if (exportReturnValue.data?.updated) {
      this.updateNotesWithAirtableId(exportReturnValue.data?.updated);
    }

    const createdCount = exportReturnValue.data?.created?.length ?? 0;
    const updatedCount = exportReturnValue.data?.updated?.length ?? 0;

    if (ResponseUtil.hasError(exportReturnValue)) {
      const errorMsg = `Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated. Error encountered: ${ErrorFactory.safeStringify(
        exportReturnValue.error
      )}`;

      this.L.error(errorMsg);
    } else {
      window.showInformationMessage(
        `Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated.`
      );
    }
  }

  private async updateNotesWithAirtableId(
    records: Records<FieldSet>
  ): Promise<void> {
    const engine = getEngine();
    // const out = await Promise.all(
    await Promise.all(
      records.map(async (ent) => {
        const airtableId = ent.id;
        const dendronId = ent.fields["DendronId"] as string;
        const note = engine.notes[dendronId];
        const noteAirtableId = _.get(note.custom, "airtableId");
        if (!noteAirtableId) {
          const updatedNote = {
            ...note,
            custom: { ...note.custom, airtableId },
          };
          const out = await engine.writeNote(updatedNote, {
            updateExisting: true,
          });
          return out;
        }
        return undefined;
      })
    );
  }

  /**
   * Get the Airtable base name to export to
   * v1 - just an input box
   * v2 - get available tables via an airtable api
   */
  private async getAirtableBaseFromUser(): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Enter the Airtable Base ID";
      inputBox.placeholder = "airtable-base-id";
      inputBox.ignoreFocusOut = true;

      inputBox.onDidAccept(() => {
        resolve(inputBox.value);
        inputBox.dispose();
      });

      inputBox.show();
    });
  }

  /**
   * Get the Airtable table name to export to
   * v1 - just an input box
   * v2 - get available tables via an airtable api
   */
  private async getTableFromUser(): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Enter the Airtable Table ID";
      inputBox.placeholder = "airtable-table-id";
      inputBox.ignoreFocusOut = true;

      inputBox.onDidAccept(() => {
        resolve(inputBox.value);
        inputBox.dispose();
      });

      inputBox.show();
    });
  }
}
