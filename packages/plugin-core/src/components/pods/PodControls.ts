import { assertUnreachable, DVault, VaultUtils } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { HistoryEvent } from "@dendronhq/engine-server";
import {
  CopyAsFormat,
  ExportPodConfigurationV2,
  ExternalConnectionManager,
  ExternalService,
  ExternalTarget,
  getAllCopyAsFormat,
  PodExportScope,
  PodUtils,
  PodV2ConfigManager,
  PodV2Types,
} from "@dendronhq/pods-core";
import path from "path";
import * as vscode from "vscode";
import { QuickPick, QuickPickItem } from "vscode";
import { DendronContext } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { KeybindingUtils } from "../../KeybindingUtils";
import { AutoCompleter } from "../../utils/autoCompleter";
import { launchGoogleOAuthFlow } from "../../utils/pods";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../../vsCodeUtils";
import { MultiSelectBtn, Selection2ItemsBtn } from "../lookup/buttons";
import { LookupControllerV3CreateOpts } from "../lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../lookup/NoteLookupProviderUtils";

/**
 * Contains VSCode UI controls for common Pod UI operations
 */
export class PodUIControls {
  /**
   * Prompts the user with a quick-pick to select a {@link ExportPodConfigurationV2}
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
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const mngr = new ExternalConnectionManager(PodUtils.getPodDir({ wsRoot }));

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
      await PodUIControls.createNewServiceConfig(connectionType);
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

  public static async createNewServiceConfig(connectionType: ExternalService) {
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
      case ExternalService.Notion: {
        await this.promptToCreateNewServiceConfig(ExternalService.Notion);
        vscode.window.showInformationMessage(
          `First setup a new ${connectionType} connection and then re-run the pod command.`
        );
        break;
      }
      default:
        assertUnreachable(connectionType);
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
    const mngr = new ExternalConnectionManager(
      ExtensionProvider.getExtension().podsDir
    );

    const id = await this.promptForGenericId();

    if (!id) {
      return;
    }

    const newFile = await mngr.createNewConfig({ serviceType, id });
    await VSCodeUtils.openFileInEditor(vscode.Uri.file(newFile));
    return id;
  }

  /**
   * Prompts a lookup control that allows user to select notes for export.
   * @param fromSelection set this flag to true if we are using {@link PodExportScope.LinksInSelection}
   * @param key key of the command. this will be used for lookup provider subscription.
   * @param logger logger object used by the command.
   * @returns
   */
  public static async promptForScopeLookup(opts: {
    fromSelection?: boolean;
    key: string;
    logger: DLogger;
  }): Promise<NoteLookupProviderSuccessResp | undefined> {
    const { fromSelection, key, logger } = opts;
    const extraButtons = [
      MultiSelectBtn.create({ pressed: true, canToggle: false }),
    ];
    if (fromSelection) {
      extraButtons.push(
        Selection2ItemsBtn.create({ pressed: true, canToggle: false })
      );
    }
    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
      vaultSelectCanToggle: false,
      extraButtons,
    };

    const extension = ExtensionProvider.getExtension();
    const lc = await extension.lookupControllerFactory.create(lcOpts);
    const provider = extension.noteLookupProviderFactory.create(key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });

    return new Promise((resolve) => {
      let disposable: vscode.Disposable;
      NoteLookupProviderUtils.subscribe({
        id: key,
        controller: lc,
        logger,
        onDone: (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          if (data.cancel) {
            resolve(undefined);
          }
          resolve(data);
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
        onHide: () => {
          resolve(undefined);
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      lc.show({
        title: "Select notes to export.",
        placeholder: "Lookup notes.",
        provider,
        selectAll: true,
      });

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (lc.quickPick) {
          lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
            lc.quickPick
          );

          lc.provider.onUpdatePickerItems({
            picker: lc.quickPick,
          });
        }
      });
    });
  }

  /**
   * Prompt to select vault
   * @returns vault
   *
   */
  public static async promptForVaultSelection(): Promise<DVault | undefined> {
    const vaults = await ExtensionProvider.getDWorkspace().vaults;
    if (vaults.length === 1) return vaults[0];

    const vaultQuickPick = await VSCodeUtils.showQuickPick(
      vaults.map((ent) => ({
        label: VaultUtils.getName(ent),
        detail: ent.fsPath,
        data: ent,
      })),
      {
        placeHolder: "Select the vault to export",
      }
    );
    return vaultQuickPick?.data;
  }

  private static getExportConfigChooserQuickPick(): QuickPick<QuickPickItem> {
    const qp = vscode.window.createQuickPick();
    qp.title = "Pick a Pod Configuration or Create a New One";
    qp.matchOnDetail = true;
    qp.matchOnDescription = true;
    qp.ignoreFocusOut = true;

    const items: QuickPickItem[] = [];

    const configs = PodV2ConfigManager.getAllPodConfigs(
      path.join(ExtensionProvider.getExtension().podsDir, "custom")
    );

    configs.forEach((config) => {
      let keybinding;

      try {
        keybinding = KeybindingUtils.getKeybindingForPodIfExists(config.podId);
      } catch (e: any) {
        if (
          e.message &&
          e.message.includes(
            KeybindingUtils.getMultipleKeybindingsMsgFormat("pod")
          )
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
   * Prompt the user via Quick Pick(s) to select the destination of the export
   * @returns
   */
  public static async promptUserForDestination(
    exportScope: PodExportScope,
    options: vscode.OpenDialogOptions
  ): Promise<"clipboard" | string | undefined> {
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
    // Cannot have clipboard be the destination on a multi-note export
    if (
      exportScope === PodExportScope.Note ||
      exportScope === PodExportScope.Selection
    ) {
      const picked = await vscode.window.showQuickPick(items);

      if (!picked) {
        return;
      }

      if (picked.label === "clipboard") {
        return "clipboard";
      }
    }

    // Else, local filesystem, show a file picker dialog:

    const fileUri = await vscode.window.showOpenDialog(options);

    if (fileUri && fileUri[0]) {
      return fileUri[0].fsPath;
    }

    return;
  }

  /**
   * Small helper method to get descriptions for {@link promptForExportScope}
   * @param scope
   * @returns
   */
  private static getDescriptionForScope(scope: PodExportScope): string {
    switch (scope) {
      case PodExportScope.Lookup:
        return "Prompts user to select note(s) for export";

      case PodExportScope.LinksInSelection:
        return "Exports all notes in wikilinks of current selected portion of text in the open note editor";

      case PodExportScope.Note:
        return "Exports the currently opened note";

      case PodExportScope.Hierarchy:
        return "Exports all notes that fall under a hierarchy";

      case PodExportScope.Vault:
        return "Exports all notes within a vault";

      case PodExportScope.Workspace:
        return "Exports all notes in the Dendron workspace";

      case PodExportScope.Selection:
        return "Export the selected text from currently opened note";

      default:
        assertUnreachable(scope);
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

      case PodV2Types.NotionExportV2:
        return "Exports notes to Notion";
      case PodV2Types.JSONExportV2:
        return "Formats notes to JSON and exports it to clipboard or local file system";

      default:
        assertUnreachable(type);
    }
  }

  /**
   * Prompt user to select custom pod Id
   */
  public static async promptToSelectCustomPodId(): Promise<string | undefined> {
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const configs = PodV2ConfigManager.getAllPodConfigs(
      path.join(PodUtils.getPodDir({ wsRoot }), "custom")
    );
    const items = configs.map<QuickPickItem>((value) => {
      return { label: value.podId, description: value.podType };
    });
    const podIdQuickPick = await VSCodeUtils.showQuickPick(items, {
      title: "Pick a pod configuration Id",
      ignoreFocusOut: true,
    });
    return podIdQuickPick?.label;
  }

  /**
   * Prompt user to select the copy as format
   */
  public static async promptToSelectCopyAsFormat(): Promise<
    CopyAsFormat | undefined
  > {
    const items = getAllCopyAsFormat().map<QuickPickItem>((value) => {
      let keybinding;

      try {
        keybinding =
          KeybindingUtils.getKeybindingsForCopyAsIfExists(value) || "";
      } catch (e: any) {
        if (
          e.message &&
          e.message.includes(
            KeybindingUtils.getMultipleKeybindingsMsgFormat("copy as")
          )
        ) {
          keybinding = "Multiple Keybindings";
        }
      }
      return {
        label: value,
        description: keybinding,
        detail: `Format Dendron note to ${value} and copy it to the clipboard`,
      };
    });
    const formatQuickPick = await VSCodeUtils.showQuickPick(items, {
      title: "Pick the format to convert",
      ignoreFocusOut: true,
    });
    return formatQuickPick?.label as CopyAsFormat;
  }
}
