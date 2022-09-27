import {
  DendronError,
  DVault,
  NoteTrait,
  OnCreateContext,
  cleanName,
  EngagementEvents,
  NoteUtils,
  SetNameModifierResp,
  parseDendronURI,
  VaultUtils,
} from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { MessageSeverity, VSCodeUtils } from "../vsCodeUtils";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";
import { ExtensionProvider } from "../ExtensionProvider";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { TemplateUtils } from "@dendronhq/common-server";
import { AnalyticsUtils } from "../utils/analytics";
import { TraitUtils } from "../traits/TraitUtils";
import _ from "lodash";
import { Disposable } from "vscode";
import { DendronContext } from "../constants";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

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
  private _trait: NoteTrait | undefined;
  private initTrait: () => NoteTrait;
  protected _extension: IDendronExtension;

  constructor(
    ext: IDendronExtension,
    commandId: string,
    // TODO: refactor trait to `initTratCb` and remove static initialization of trait
    trait: NoteTrait | (() => NoteTrait)
  ) {
    super();
    this.key = commandId;
    this.skipAnalytics = true;

    if (_.isFunction(trait)) {
      this.initTrait = trait;
    } else {
      this.initTrait = () => trait;
    }
    this._extension = ext;
  }

  private get trait(): NoteTrait {
    if (!this._trait) {
      this._trait = this.initTrait();
      if (_.isUndefined(this._trait)) {
        throw new DendronError({
          message: `unable to init trait for ${this.key}`,
        });
      }
    }
    return this._trait;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    if (!TraitUtils.checkWorkspaceTrustAndWarn()) {
      return;
    }

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

    if (!TraitUtils.checkWorkspaceTrustAndWarn()) {
      return;
    }

    let title;
    let body;
    let custom;
    let vault: DVault | undefined;

    // TODO: GoToNoteCommand() needs to have its arg behavior fixed, and then
    // this vault logic can be deferred there.

    if (this.trait.OnCreate?.setVault) {
      try {
        const vaultName = this.trait.OnCreate.setVault();
        const { vaults } = ExtensionProvider.getDWorkspace();
        vault = vaults.find((vault) => VaultUtils.getName(vault) === vaultName);
        if (!vault) {
          VSCodeUtils.showMessage(
            MessageSeverity.ERROR,
            "Vault specified in the note trait does not exist",
            {}
          );
          return;
        }
      } catch (Error: any) {
        this.L.error({ ctx: "traint.onCreate.setVault", msg: Error });
      }
    } else {
      vault = opts.vaultOverride;
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
    }

    // Handle Trait Behavior
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
      let maybeVault: DVault | undefined;
      // for cross vault template
      const { link: fname, vaultName } = parseDendronURI(templateNoteName);
      if (!_.isUndefined(vaultName)) {
        maybeVault = VaultUtils.getVaultByName({
          vname: vaultName,
          vaults: ExtensionProvider.getEngine().vaults,
        });
        // If vault is not found, skip lookup through rest of notes and return error
        if (_.isUndefined(maybeVault)) {
          this.L.error({
            ctx: "trait.OnCreate.setTemplate",
            msg: `No vault found for ${vaultName}`,
          });
          return;
        }
      }

      const notes = await ExtensionProvider.getEngine().findNotes({
        fname,
        vault: maybeVault,
      });

      const dummy = NoteUtils.createForFake({
        contents: "",
        fname: "trait-tmp",
        id: "trait-tmp",
        vault: vault!,
      });

      if (notes && notes.length > 0) {
        // Only apply schema if note is found
        TemplateUtils.applyTemplate({
          templateNote: notes[0], // Ok to use [0] here because we specified a vault in findNotes()
          targetNote: dummy,
          engine: this._extension.getEngine(),
        });

        body = dummy.body;
        custom = dummy.custom;

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

    await new GotoNoteCommand(this._extension).execute({
      qs: fname,
      vault,
      overrides: { title, traits: [this.trait.id], body, custom },
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
      let disposable: Disposable;

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

          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          vscode.window.showErrorMessage(error.message);
          resolve(undefined);
          NoteLookupProviderUtils.cleanup({
            id: "createNoteWithTrait",
            controller: lc,
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      lc.show({
        placeholder: "Enter Note Name",
        provider,
        initialValue: defaultNoteName,
        title: `Create Note with Trait`,
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
}
