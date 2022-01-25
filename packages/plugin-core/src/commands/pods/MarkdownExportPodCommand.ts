import { ErrorFactory, ResponseUtil } from "@dendronhq/common-all";
import {
  ConfigFileUtils,
  createRunnableMarkdownV2PodConfigSchema,
  ExportPodV2,
  isRunnableMarkdownV2PodConfig,
  JSONSchemaType,
  MarkdownExportPodV2,
  MarkdownExportReturnType,
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
  MarkdownExportReturnType
> {
  public key = "dendron.markdownexportv2";

  public constructor() {
    super(new QuickPickHierarchySelector());
  }

  public async gatherInputs(
    opts?: Partial<MarkdownV2PodConfig>
  ): Promise<RunnableMarkdownV2PodConfig | undefined> {
    if (isRunnableMarkdownV2PodConfig(opts)) {
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
      canSelectFiles: false,
      canSelectFolders: true,
    };
    const destination =
      opts && opts.destination
        ? opts.destination
        : await PodUIControls.promptUserForDestination(exportScope, options);
    if (!destination) {
      return;
    }

    //use FM Title as h1 header
    const addFrontmatterTitle =
      opts && opts.addFrontmatterTitle
        ? opts.addFrontmatterTitle
        : await this.promptUserForaddFMTitleSetting();
    if (addFrontmatterTitle === undefined) return;

    const config = {
      exportScope,
      wikiLinkToURL: opts?.wikiLinkToURL || false,
      destination,
      addFrontmatterTitle,
      convertTagNotesToLinks: opts?.convertTagNotesToLinks || false,
      convertUserNotesToLinks: opts?.convertUserNotesToLinks || false,
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

  public async onExportComplete({
    exportReturnValue,
    config,
  }: {
    exportReturnValue: MarkdownExportReturnType;
    config: RunnableMarkdownV2PodConfig;
  }) {
    const data = exportReturnValue.data?.exportedNotes;
    if (_.isString(data) && config.destination === "clipboard") {
      vscode.env.clipboard.writeText(data);
    }
    const count = data?.length ?? 0;
    if (ResponseUtil.hasError(exportReturnValue)) {
      const errorMsg = `Finished Markdown Export. ${count} notes exported; Error encountered: ${ErrorFactory.safeStringify(
        exportReturnValue.error
      )}`;
      this.L.error(errorMsg);
    } else {
      vscode.window.showInformationMessage(
        "Finished running Markdown export pod."
      );
    }
  }

  public createPod(
    config: RunnableMarkdownV2PodConfig
  ): ExportPodV2<MarkdownExportReturnType> {
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
   * Prompt user with simple quick pick to select whether to use FM title as h1 header or not
   * @returns
   */
  private async promptUserForaddFMTitleSetting(): Promise<boolean | undefined> {
    const items: vscode.QuickPickItem[] = [
      {
        label: "Add note title from FM as h1 header",
        detail:
          "Add note title from the frontmatter to the start of exported note",
      },
      {
        label: "Skip adding note FM title as h1 header",
        detail:
          "Skip adding note title from the frontmatter to the start of exported note",
      },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      title: "Do you want to add note frontmatter title as h1 header?",
    });

    return picked
      ? picked.label === "Add note title from FM as h1 header"
      : undefined;
  }
}
