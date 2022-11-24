import { VaultUtils } from "@dendronhq/common-all";
import {
  getAllImportPods,
  MarkdownImportPod,
  podClassEntryToPodItemV4,
} from "@dendronhq/pods-core";
import vscode from "vscode";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { DENDRON_COMMANDS } from "../../constants";
import { PodQuickPickItemV4 } from "../../utils/pods";
import { CommandOpts, ImportPodCommand } from "../ImportPod";

/**
 * Convenience command that uses the same flow as {@link ImportPodCommand} for
 * Markdown Pod but simplifies the steps by not requiring the user to fill out a
 * config.yml file.
 */
export class ImportObsidianCommand extends ImportPodCommand {
  key = DENDRON_COMMANDS.IMPORT_OBSIDIAN_POD.key;

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllImportPods();
  }

  /**
   * Hardcoded to use markdown pod, as Obsidian is a markdown import.
   * @returns
   */
  override async gatherInputs() {
    const markdownPod = podClassEntryToPodItemV4(MarkdownImportPod);

    const podChoice = {
      label: markdownPod.id,
      ...markdownPod,
    } as PodQuickPickItemV4;

    return { podChoice };
  }

  /**
   * Use a file picker control instead of a pod config YAML file to get the
   * Obsidian vault location. Also, just default to the current vault.
   * @returns
   */
  override async enrichInputs(): Promise<CommandOpts | undefined> {
    const podChoice = podClassEntryToPodItemV4(MarkdownImportPod);

    const uri = await vscode.window.showOpenDialog({
      title: "Obsidian vault location to import",
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });

    if (!uri || uri.length === 0) {
      return;
    }

    const src = uri[0].fsPath;

    const vault = await PickerUtilsV2.getVaultForOpenEditor();

    const config = {
      src,
      vaultName: VaultUtils.getName(vault),
    };

    return { podChoice, config };
  }
}
