import {
  ExportPodConfigurationV2,
  ExternalConnectionManager,
  ExternalService,
  ExternalTarget,
  PodExportScope,
  PodV2ConfigManager,
  PodV2Types,
} from "@dendronhq/pods-core";
import path from "path";
import * as vscode from "vscode";
import { QuickPick, QuickPickItem } from "vscode";
import { KeybindingUtils } from "../../KeybindingUtils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { CodeCommandInstance } from "../../commands/base";
import { launchGoogleOAuthFlow } from "../../utils/pods";
import { getExtension } from "../../workspace";
import { PodCommandFactory } from "./PodCommandFactory";
import { assertUnreachable } from "@dendronhq/common-all";

/**
 * Contains VSCode UI controls for common Pod UI operations
 */
export class PodUIControls {
  /**
   * Prompts the user with a quick-pick to select a {@link PodConfigurationV2}
   * by its podId. Furthermore, there is an option to create a new export
   * configuration intead.
   * @returns
   */
  public static async promptForExportConfigOrNewExport(): Promise<
    Pick<ExportPodConfigurationV2, "podId"> | "New Export" | undefined
  > {
    return new Promise<
      Pick<ExportPodConfigurationV2, "podId"> | "New Export" | undefined
    >((resolve) => {
      const qp = this.getExportConfigChooserQuickPick();

      qp.onDidAccept(() => {
        if (qp.selectedItems === undefined || qp.selectedItems.length === 0) {
          resolve(undefined);
        } else if (qp.selectedItems[0].label === "New Export") {
          resolve("New Export");
        } else {
          resolve({ podId: qp.selectedItems[0].label });
        }

        qp.dispose();
        return;
      });

      qp.show();
    });
  }

  /**
   * Prompts user with a quick pick to specify the {@link PodExportScope}
   */
  public static async promptForExportScope(): Promise<
    PodExportScope | undefined
  > {
    return new Promise<PodExportScope | undefined>((resolve) => {
      const qp = vscode.window.createQuickPick();
      qp.ignoreFocusOut = true;
      qp.title = "Select the Export Scope";
      qp.items = Object.keys(PodExportScope)
        .filter((key) => Number.isNaN(Number(key)))
        .map<QuickPickItem>((value) => {
          return {
            label: value,
            detail: PodUIControls.getDescriptionForScope(
              value as PodExportScope
            ),
          };
        });

      qp.onDidAccept(() => {
        resolve(
          PodExportScope[
            qp.selectedItems[0].label as keyof typeof PodExportScope
          ]
        );
        qp.dispose();
      });

      qp.show();
    });
  }

  /**
   * Ask the user if they want to save their input choices as a new pod config,
   * enabling them to run it again later.
   * @returns a pod ID for the new config if they want to save it, false if they
   * don't want to save it, or undefined if they closed out the quick pick.
   */
  public static async promptToSaveInputChoicesAsNewConfig(): Promise<
    false | string | undefined
  > {
    const items: vscode.QuickPickItem[] = [
      {
        label: "Yes",
        detail:
          "Select this option if you anticipate running this pod multiple-times",
      },
      {
        label: "No",
        detail: "Run this pod now",
      },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      title: "Would you like to save this configuration?",
      ignoreFocusOut: true,
    });

    if (picked === undefined) {
      return;
    }

    if (picked.label === "No") {
      return false;
    }

    return this.promptForGenericId();
  }

  /**
   * Get a generic ID from the user through a quick input box.
   * @returns
   */
  public static async promptForGenericId(): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Select a unique ID for your configuration";
      inputBox.placeholder = "my-id";
      inputBox.ignoreFocusOut = true;
      let id;
      inputBox.onDidAccept(() => {
        id = inputBox.value;
        resolve(id);
        inputBox.dispose();
        return;
      });

      inputBox.onDidHide(() => {
        resolve(undefined);
        inputBox.dispose();
      });

      inputBox.show();
    });
  }

  /**
   * Prompt user to pick a pod (v2) type
   * @returns a runnable code command for the selected pod
   */
  public static async promptForPodTypeForCommand(): Promise<
    CodeCommandInstance | undefined
  > {
    const picked = await PodUIControls.promptForPodType();

    if (!picked) {
      return;
    }

    return PodCommandFactory.createPodCommandForPodType(picked);
  }

  /**
   * Prompt user to pick a pod (v2) type
   * @returns a runnable code command for the selected pod
   */
  public static async promptForPodType(): Promise<PodV2Types | undefined> {
    const newConnectionOptions = Object.keys(PodV2Types)
      .filter((key) => Number.isNaN(Number(key)))
      .map<QuickPickItem>((value) => {
        return {
          label: value,
          detail: PodUIControls.getDescriptionForPodType(value as PodV2Types),
        };
      });
    const picked = await vscode.window.showQuickPick(newConnectionOptions, {
      title: "Pick the Pod Type",
      ignoreFocusOut: true,
    });

    if (!picked) {
      return;
    }

    return picked.label as PodV2Types;
  }

  /**
   * Prompt user to pick an {@link ExternalService}
   * @returns
   */
  public static async promptForExternalServiceType(): Promise<
    ExternalService | undefined
  > {
    const newConnectionOptions = Object.keys(ExternalService)
      .filter((key) => Number.isNaN(Number(key)))
      .map<QuickPickItem>((value) => {
        return { label: value };
      });
    const picked = await vscode.window.showQuickPick(newConnectionOptions, {
      title: "Pick the Service Connection Type",
      ignoreFocusOut: true,
    });

    if (!picked) {
      return;
    }
    return picked.label as ExternalService;
  }

  /**
   * Prompt user to pick an existing service connection, or to create a new one.
   * @returns
   */
  public static async promptForExternalServiceConnectionOrNew<
    T extends ExternalTarget
  >(connectionType: ExternalService): Promise<undefined | T> {
    const mngr = new ExternalConnectionManager(getExtension().podsDir);

    const existingConnections = await mngr.getAllConfigsByType(connectionType);

    const items = existingConnections.map<QuickPickItem>((value) => {
      return { label: value.connectionId };
    });

    const createNewOptionString = `Create new ${connectionType} connection`;
    const newConnectionOption = {
      label: createNewOptionString,
    };

    const selectedServiceOption = await vscode.window.showQuickPick(
      items.concat(newConnectionOption),
      { title: "Pick the service connection for export", ignoreFocusOut: true }
    );

    if (!selectedServiceOption) {
      return;
    }

    if (selectedServiceOption.label === createNewOptionString) {
      switch (connectionType) {
        case ExternalService.Airtable: {
          await this.promptToCreateNewServiceConfig(ExternalService.Airtable);
          vscode.window.showInformationMessage(
            `First setup a new ${connectionType} connection and then re-run the pod command.`
          );
          break;
        }
        case ExternalService.GoogleDocs: {
          const id = await this.promptToCreateNewServiceConfig(
            ExternalService.GoogleDocs
          );
          await launchGoogleOAuthFlow(id);
          vscode.window.showInformationMessage(
            "Google OAuth is a beta feature. Please contact us at support@dendron.so or on Discord to first gain access. Then, try again and authenticate with Google on your browser to continue."
          );
          break;
        }
        default:
      }
      return;
    } else {
      const config = mngr.getConfigById<T>({ id: selectedServiceOption.label });

      if (!config) {
        vscode.window.showErrorMessage(
          `Couldn't find service config with ID ${selectedServiceOption.label}.`
        );
        return;
      }

      return config;
    }
  }

  /**
   * Ask the user to pick an ID for a new service connection. The connection
   * file will be opened in the editor.
   * @param serviceType
   * @returns
   */
  public static async promptToCreateNewServiceConfig(
    serviceType: ExternalService
  ) {
    const mngr = new ExternalConnectionManager(getExtension().podsDir);

    const id = await this.promptForGenericId();

    if (!id) {
      return;
    }

    const newFile = await mngr.createNewConfig({ serviceType, id });
    await VSCodeUtils.openFileInEditor(vscode.Uri.file(newFile));
    return id;
  }

  private static getExportConfigChooserQuickPick(): QuickPick<QuickPickItem> {
    const qp = vscode.window.createQuickPick();
    qp.title = "Pick a Pod Configuration or Create a New One";
    qp.matchOnDetail = true;
    qp.matchOnDescription = true;
    qp.ignoreFocusOut = true;

    const items: QuickPickItem[] = [];

    const configs = PodV2ConfigManager.getAllPodConfigs(
      path.join(getExtension().podsDir, "custom")
    );

    configs.forEach((config) => {
      let keybinding;

      try {
        keybinding = KeybindingUtils.getKeybindingForPodIfExists(config.podId);
      } catch (e: any) {
        if (
          e.message &&
          e.message.includes(KeybindingUtils.MULTIPLE_KEYBINDINGS_MSG_FMT)
        ) {
          keybinding = "Multiple Keybindings";
        }
      }

      let description = config.podType.toString();

      if (keybinding) {
        description = description + "  " + keybinding;
      }

      items.push({
        label: config.podId,
        detail: config.description ?? undefined,
        description,
      });
    });

    items.push({
      label: "New Export",
      detail:
        "Create a new export for either one-time use or to save to a new pod configuration",
    });

    qp.items = items;
    return qp;
  }

  /**
   * Small helper method to get descriptions for {@link promptForExportScope}
   * @param scope
   * @returns
   */
  private static getDescriptionForScope(scope: PodExportScope): string {
    switch (scope) {
      case PodExportScope.Clipboard:
        return "Exports the current contents of your clipboard";

      case PodExportScope.Selection:
        return "Exports the current contents of the selected portion of text in the open note editor";

      case PodExportScope.Note:
        return "Exports the currently opened note";

      case PodExportScope.Hierarchy:
        return "Exports all notes that fall under a hierarchy";

      case PodExportScope.Vault:
        return "Exports all notes within a vault";

      case PodExportScope.Workspace:
        return "Exports all notes in the Dendron workspace";

      default:
        assertUnreachable();
    }
  }

  /**
   * Small helper method to get descriptions for {@link promptForExportScope}
   * @param type
   * @returns
   */
  private static getDescriptionForPodType(type: PodV2Types): string {
    switch (type) {
      case PodV2Types.AirtableExportV2:
        return "Exports notes to rows in an Airtable";

      case PodV2Types.MarkdownExportV2:
        return "Formats Dendron markdown and exports it to the clipboard or local file system";

      case PodV2Types.GoogleDocsExportV2:
        return "Formats Dendron note to google doc";

      default:
        assertUnreachable();
    }
  }
}
