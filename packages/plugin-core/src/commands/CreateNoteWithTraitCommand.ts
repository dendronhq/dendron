import {
  DendronError,
  DVault,
  NoteTrait,
  OnCreateContext,
  cleanName,
} from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import {
  PickerUtilsV2,
} from "../components/lookup/utils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { ExtensionProvider } from "../ExtensionProvider";
import { VaultSelectionModeConfig } from "../components/lookup/vaultSelectionModeConfig";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";

export type CommandOpts = {
  fname: string;
  vaultOverride?: DVault;
};

export type CommandInput = {
  fname: string;
};

export class CreateNoteWithTraitCommand extends BaseCommand<
  CommandOpts,
  any,
  CommandInput
> {
  key: string;
  trait: NoteTrait;
  protected _extension: IDendronExtension;

  constructor(ext: IDendronExtension, commandId: string, trait: NoteTrait) {
    super();
    this.key = commandId;
    this.trait = trait;
    this._extension = ext;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    // If there's no modifier, provide a regular lookup UI.
    if (!this.trait.OnWillCreate?.setNameModifier) {
      const resp = await this.getNoteNameFromLookup();

      if (!resp) {
        return;
      }

      return {
        fname: resp,
      };
    }

    try {
      if (!this.checkWorkspaceTrustAndWarn()) {
        return;
      }

      const context = await this.getCreateContext();
      const resp = this.trait.OnWillCreate.setNameModifier(context);

      let fname = resp.name;

      if (resp.promptUserForModification) {
        const resp = await this.getNoteNameFromLookup(fname);

        if (!resp) {
          return;
        }

        fname = resp;
      }

      return {
        fname,
      };
    } catch (e: any) {
      this.L.error(e);
      //TODO: Info box with error.
      return;
    }
  }

  async enrichInputs(inputs: CommandInput) {
    const { fname: title } = inputs;
    return {
      title,
      fname: `${cleanName(title)}`,
    };
  }

  async execute(opts: CommandOpts) {
    const { fname } = opts;
    const ctx = "CreateNoteWithTraitCommand";

    this.L.info({ ctx, msg: "enter", opts });

    let title;

    if (this.trait.OnCreate?.setTitle && this.checkWorkspaceTrustAndWarn()) {
      const context = await this.getCreateContext();
      context.currentNoteName = fname;

      title = this.trait.OnCreate.setTitle(context);
    }

    // TODO: GoToNoteCommand() needs to have its arg behavior fixed, and then
    // this vault logic can be deferred there.
    let vault = opts.vaultOverride;
    if (!opts.vaultOverride) {
      const selectionMode = VaultSelectionModeConfig.getVaultSelectionMode();

      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const selectedVault = await PickerUtilsV2.getOrPromptVaultForNewNote({
        vault: currentVault,
        fname,
        vaultSelectionMode: selectionMode,
      });

      if (!selectedVault) {
        vscode.window.showInformationMessage("Note creation cancelled");
        return;
      } else {
        vault = selectedVault;
      }
    }

    await new GotoNoteCommand(this._extension).execute({
      qs: fname,
      vault,
      overrides: { title, traits: [this.trait] },
    });

    this.L.info({ ctx, msg: "exit" });
  }

  private async getNoteNameFromLookup(
    initialValue?: string
  ): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const lookupCreateOpts: LookupControllerV3CreateOpts = {
        nodeType: "note",
        disableVaultSelection: true,
      };
      const extension = ExtensionProvider.getExtension();
      const lc = extension.lookupControllerFactory.create(lookupCreateOpts);

      const provider = extension.noteLookupProviderFactory.create(
        "createNoteWithTrait",
        {
          allowNewNote: true,
          forceAsIsPickerValueUsage: true,
        }
      );

      const defaultNoteName =
        initialValue ??
        path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );

      NoteLookupProviderUtils.subscribe({
        id: "createNoteWithTrait",
        controller: lc,
        logger: this.L,
        onHide: () => {
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id: "createNoteWithTrait",
            controller: lc,
          });
        },
        onDone: (event: HistoryEvent) => {
          const data = event.data;
          if (data.cancel) {
            resolve(undefined);
          } else {
            resolve(data.selectedItems[0].fname);
          }
          NoteLookupProviderUtils.cleanup({
            id: "createNoteWithTrait",
            controller: lc,
          });
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          vscode.window.showErrorMessage(error.message);
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id: "createNoteWithTrait",
            controller: lc,
          });
        },
      });
      lc.show({
        placeholder: "Enter Note Name",
        provider,
        initialValue: defaultNoteName,
        title: `Create Note with Trait`,
      });
    });
  }

  private async getCreateContext(): Promise<OnCreateContext> {
    const clipboard = await vscode.env.clipboard.readText();
    const activeRange = await VSCodeUtils.extractRangeFromActiveEditor();
    const { document, range } = activeRange || {};

    const selectedText = document ? document.getText(range).trim() : "";
    const openNoteName = vscode.window.activeTextEditor?.document.uri.fsPath
      ? path.basename(
          vscode.window.activeTextEditor?.document.uri.fsPath,
          ".md"
        )
      : "";

    return {
      selectedText,
      clipboard,
      currentNoteName: openNoteName,
    };
  }

  private checkWorkspaceTrustAndWarn(): boolean {
    const engine = this._extension.getEngine();

    if (!engine.trustedWorkspace) {
      vscode.window.showWarningMessage(
        "Workspace Trust has been disabled for this workspace. Note Trait behavior will not be applied."
      );
    }

    return engine.trustedWorkspace;
  }
}
