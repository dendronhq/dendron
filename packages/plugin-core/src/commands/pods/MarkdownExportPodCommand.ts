import { NoteProps } from "@dendronhq/common-all";
import {
  ConfigFileUtils,
  createRunnableMarkdownV2PodConfigSchema,
  ExportPodV2,
  isRunnableMarkdownV2PodConfig,
  JSONSchemaType,
  MarkdownExportPodV2,
  MarkdownV2PodConfig,
  PodV2Types,
  RunnableMarkdownV2PodConfig,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { QuickPickHierarchySelector } from "../../components/lookup/HierarchySelector";
import { PodUIControls } from "../../components/pods/PodControls";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace, getEngine, getExtension } from "../../workspace";
import { BaseExportPodCommand } from "./BaseExportPodCommand";

/**
 * VSCode command for running the Markdown Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export class MarkdownExportPodCommand extends BaseExportPodCommand<
  RunnableMarkdownV2PodConfig,
  string
> {
  public key = "dendron.markdownexportv2";

  public constructor() {
    super(new QuickPickHierarchySelector());
  }

  public async gatherInputs(
    opts?: Partial<MarkdownV2PodConfig>
  ): Promise<RunnableMarkdownV2PodConfig | undefined> {
    if (isRunnableMarkdownV2PodConfig(opts)) {
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

    const destination = await this.promptUserForDestination();
    if (!destination) {
      return;
    }

    const wikiLinkToURL = await this.promptUserForWikilinkToURLSetting();
    if (wikiLinkToURL === undefined) {
      return;
    }

    const config = {
      exportScope,
      wikiLinkToURL,
      destination,
    };

    // If this is not an already saved pod config, then prompt user whether they
    // want to save as a new config or just run it one-time
    if (!opts?.podId) {
      const choice = await PodUIControls.promptToSaveInputChoicesAsNewConfig();

      if (choice !== undefined && choice !== false) {
        const configPath = ConfigFileUtils.genConfigFileV2({
          fPath: path.join(
            getExtension().podsDir,
            "custom",
            `config.${choice}.yml`
          ),
          configSchema: MarkdownExportPodV2.config(),
          setProperties: _.merge(config, {
            podId: choice,
            podType: PodV2Types.MarkdownExportV2,
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

  public onExportComplete({
    exportReturnValue,
    payload,
    config,
  }: {
    exportReturnValue: string;
    payload: string | NoteProps;
    config: RunnableMarkdownV2PodConfig;
  }): void {
    if (config.destination === "clipboard") {
      if (typeof payload === "string") {
        vscode.env.clipboard.writeText(exportReturnValue);
      } else {
        //TODO: This error needs to be thrown earlier.
        // throw new Error(
        //   "Cannot have clipboard be the destination on a multi-note export"
        // );

        vscode.env.clipboard.writeText(exportReturnValue);
      }
    } else {
      throw new Error("Not yet implemented");
    }

    vscode.window.showInformationMessage(
      "Finished running Markdown export pod."
    );
  }

  public createPod(config: RunnableMarkdownV2PodConfig): ExportPodV2<string> {
    return new MarkdownExportPodV2({
      podConfig: config,
      engine: getEngine(),
      dendronConfig: getDWorkspace().config,
    });
  }

  public getRunnableSchema(): JSONSchemaType<RunnableMarkdownV2PodConfig> {
    return createRunnableMarkdownV2PodConfigSchema();
  }

  /*
   * Region: UI Controls
   */

  /**
   * Prompt user with simple quick pick on which wikilink conversion setting to
   * use
   * @returns
   */
  private async promptUserForWikilinkToURLSetting(): Promise<
    boolean | undefined
  > {
    const items: vscode.QuickPickItem[] = [
      {
        label: "Convert wikilinks to URLs",
        detail:
          "Converts wikilinks to their corresponding URLs on a Dendron published site",
      },
      {
        label: "Don't modify wikilinks",
        detail: "Wikilinks will be preserved in their [[existing-format]]",
      },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      title: "How would you like wikilinks to be formatted?",
    });

    return picked ? picked.label === "Convert wikilinks to URLs" : undefined;
  }

  /**
   * Prompt the user via Quick Pick(s) to select the destination of the export
   * @returns
   */
  private async promptUserForDestination(): Promise<
    "clipboard" | string | undefined
  > {
    const items: vscode.QuickPickItem[] = [
      {
        label: "clipboard",
        detail: "Puts the contents of the export into your clipboard",
      },
      {
        label: "local filesystem",
        detail: "Exports the contents to a local directory",
      },
    ];
    const picked = await vscode.window.showQuickPick(items);

    if (!picked) {
      return;
    }

    if (picked.label === "clipboard") {
      return "clipboard";
    }

    // Else, local filesystem, show a file picker dialog:
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select Export Destination",
      canSelectFiles: false,
      canSelectFolders: true,
    };

    const fileUri = await vscode.window.showOpenDialog(options);

    if (fileUri && fileUri[0]) {
      return fileUri[0].fsPath;
    }

    return;
  }
}
