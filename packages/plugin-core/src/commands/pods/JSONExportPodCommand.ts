import { ErrorFactory, ResponseUtil } from "@dendronhq/common-all";
import {
  ConfigFileUtils,
  createRunnableJSONV2PodConfigSchema,
  ExportPodV2,
  isRunnableJSONV2PodConfig,
  JSONExportPodV2,
  JSONExportReturnType,
  JSONSchemaType,
  JSONV2PodConfig,
  PodUtils,
  PodV2Types,
  RunnableJSONV2PodConfig,
} from "@dendronhq/pods-core";
import _ from "lodash";
import * as vscode from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { VSCodeUtils } from "../../vsCodeUtils";
import { BaseExportPodCommand } from "./BaseExportPodCommand";

/**
 * VSCode command for running the JSON Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class JSONExportPodCommand extends BaseExportPodCommand<
  RunnableJSONV2PodConfig,
  JSONExportReturnType
> {
  public key = "dendron.jsonexportv2";
  public constructor(extension: IDendronExtension) {
    super(new QuickPickHierarchySelector(), extension);
  }

  public async gatherInputs(
    opts?: Partial<JSONV2PodConfig>
  ): Promise<RunnableJSONV2PodConfig | undefined> {
    if (isRunnableJSONV2PodConfig(opts)) {
      const { destination, exportScope } = opts;
      this.multiNoteExportCheck({ destination, exportScope });
      return opts;
    }

    // First get the export scope:
    const exportScope =
      opts && opts.exportScope
        ? opts.exportScope
        : await PodUIControls.promptForExportScope();

    if (!exportScope) {
      return;
    }

    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select Export Destination",
      canSelectFiles: true,
      canSelectFolders: false,
    };
    const destination = await PodUIControls.promptUserForDestination(
      exportScope,
      options
    );
    if (!destination) {
      return;
    }

    const config = {
      exportScope,
      destination,
    };

    // If this is not an already saved pod config, then prompt user whether they
    // want to save as a new config or just run it one-time
    if (!opts?.podId) {
      const choice = await PodUIControls.promptToSaveInputChoicesAsNewConfig();
      const { wsRoot } = this.extension.getDWorkspace();
      if (choice !== undefined && choice !== false) {
        const configPath = ConfigFileUtils.genConfigFileV2({
          fPath: PodUtils.getCustomConfigPath({ wsRoot, podId: choice }),
          configSchema: JSONExportPodV2.config(),
          setProperties: _.merge(config, {
            podId: choice,
            podType: PodV2Types.JSONExportV2,
          }),
        });

        vscode.window
          .showInformationMessage(
            `Configuration saved to ${configPath}`,
            "Open Config"
          )
          .then((selectedItem) => {
            if (selectedItem) {
              VSCodeUtils.openFileInEditor(vscode.Uri.file(configPath));
            }
          });
      }
    }

    return config;
  }

  public async onExportComplete({
    exportReturnValue,
    config,
  }: {
    exportReturnValue: JSONExportReturnType;
    config: RunnableJSONV2PodConfig;
  }) {
    let successMessage = "Finished running JSON export pod.";
    const data = exportReturnValue.data?.exportedNotes;
    if (_.isString(data) && config.destination === "clipboard") {
      vscode.env.clipboard.writeText(data);
      successMessage += " Content is copied to the clipboard";
    }
    if (ResponseUtil.hasError(exportReturnValue)) {
      const errorMsg = `Finished JSON Export. Error encountered: ${ErrorFactory.safeStringify(
        exportReturnValue.error
      )}`;
      this.L.error(errorMsg);
    } else {
      vscode.window.showInformationMessage(successMessage);
    }
  }

  public createPod(
    config: RunnableJSONV2PodConfig
  ): ExportPodV2<JSONExportReturnType> {
    return new JSONExportPodV2({
      podConfig: config,
    });
  }

  public getRunnableSchema(): JSONSchemaType<RunnableJSONV2PodConfig> {
    return createRunnableJSONV2PodConfigSchema();
  }
}
