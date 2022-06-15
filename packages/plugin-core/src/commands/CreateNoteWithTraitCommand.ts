import {
  DendronError,
  DVault,
  NoteTrait,
  OnCreateContext,
  cleanName,
  EngagementEvents,
  NoteUtils,
  SetNameModifierResp,
} from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { ExtensionProvider } from "../ExtensionProvider";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { TemplateUtils } from "@dendronhq/common-server";
import { AnalyticsUtils } from "../utils/analytics";

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

      // Default settings in case something goes wrong.
      let resp: SetNameModifierResp = {
        name: context.currentNoteName ?? "",
        promptUserForModification: true,
      };

      try {
        resp = this.trait.OnWillCreate.setNameModifier(context);
      } catch (Error: any) {
        this.L.error({ ctx: "trait.OnWillCreate.setNameModifier", msg: Error });
      }

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

  async execute(opts: CommandOpts): Promise<any> {
    const { fname } = opts;
    const ctx = "CreateNoteWithTraitCommand";

    this.L.info({ ctx, msg: "enter", opts });

    let title;
    let body;

    // TODO: GoToNoteCommand() needs to have its arg behavior fixed, and then
    // this vault logic can be deferred there.
    let vault = opts.vaultOverride;
    if (!opts.vaultOverride) {
      const selectionMode =
        VaultSelectionModeConfigUtils.getVaultSelectionMode();

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

    // Handle Trait Behavior
    if (this.checkWorkspaceTrustAndWarn()) {
      if (this.trait.OnCreate?.setTitle) {
        const context = await this.getCreateContext();
        context.currentNoteName = fname;

        try {
          title = this.trait.OnCreate.setTitle(context);
        } catch (Error: any) {
          this.L.error({ ctx: "trait.OnCreate.setTitle", msg: Error });
        }
      }

      if (this.trait.OnCreate?.setBody) {
        try {
          body = await this.trait.OnCreate.setBody();
        } catch (Error: any) {
          this.L.error({ ctx: "trait.OnCreate.setBody", msg: Error });
        }
      } else if (this.trait.OnCreate?.setTemplate) {
        // Check if we should apply a template from any traits:
        let templateNoteName = "";
        try {
          templateNoteName = this.trait.OnCreate.setTemplate();
        } catch (Error: any) {
          this.L.error({ ctx: "trait.OnCreate.setTemplate", msg: Error });
        }

        const notes = await ExtensionProvider.getEngine().findNotes({
          fname: templateNoteName,
          vault,
        });

        const dummy = NoteUtils.createForFake({
          contents: "",
          fname: "trait-tmp",
          id: "trait-tmp",
          vault: vault!,
        });

        if (notes) {
          // Only apply schema if note is found
          TemplateUtils.applyTemplate({
            templateNote: notes[0], // Ok to use [0] here because we specified a vault in findNotes()
            targetNote: dummy,
            engine: this._extension.getEngine(),
          });

          body = dummy.body;

          AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
            source: "Trait",
          });
        } else {
          this.L.error({
            ctx: "trait.OnCreate.setTemplate",
            msg: `Unable to find note with name ${templateNoteName} to use as template.`,
          });
        }
      }
    }

    await new GotoNoteCommand(this._extension).execute({
      qs: fname,
      vault,
      overrides: { title, traits: [this.trait.id], body },
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
