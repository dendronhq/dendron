import {
  ConfigUtils,
  NoteTrait,
  OnCreateContext,
  RespV2,
} from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import path from "path";
import * as vscode from "vscode";
import {
  LookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  OnAcceptHook,
} from "../components/lookup/LookupProviderV3";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

export type CommandOpts = {
  fname: string;
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
  type: NoteTrait;

  constructor(commandId: string, type: NoteTrait) {
    super();
    this.key = commandId;
    this.type = type;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    // If there's no modifier, provide a regular lookup UI.
    if (!this.type.OnWillCreate?.setNameModifier) {
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
      const resp = this.type.OnWillCreate.setNameModifier(context);

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
    const ctx = "CreateTypedNoteCommand";

    this.L.info(ctx);

    let title;

    if (this.type.OnCreate?.setTitle) {
      const context = await this.getCreateContext();
      context.currentNoteName = fname;

      title = this.type.OnCreate.setTitle(context);
    }

    const config = getDWorkspace().config;
    const confirmVaultOnCreate =
      ConfigUtils.getCommands(config).lookup.note.confirmVaultOnCreate;
    const { engine } = getDWorkspace();
    let vault;
    if (confirmVaultOnCreate) {
      vault = await PickerUtilsV2.promptVault(engine.vaults);
      if (vault === undefined) {
        vscode.window.showInformationMessage("Note creation cancelled");
        return;
      }
    }

    await new GotoNoteCommand().execute({
      qs: fname,
      vault,
      overrides: { title, types: [this.type] },
    });
  }

  private async getNoteNameFromLookup(
    initialValue?: string
  ): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const lookupCreateOpts: LookupControllerV3CreateOpts = {
        nodeType: "note",
        // disableVaultSelection: opts?.useSameVault,
        // If vault selection is enabled we alwaysPrompt selection mode,
        // hence disable toggling.
        // vaultSelectCanToggle: false,
        // extraButtons: [MultiSelectBtn.create(false)],
      };
      const lc = LookupControllerV3.create(lookupCreateOpts);

      const provider = new NoteLookupProvider("createTypedNote", {
        allowNewNote: true,
        forceAsIsPickerValueUsage: true,
      });

      const onAccepted: OnAcceptHook = async ({
        selectedItems,
      }): Promise<RespV2<any>> => {
        if (!selectedItems || selectedItems.length === 0) {
          resolve(undefined);
        } else {
          const selected = selectedItems[0].fname;
          resolve(selected);
        }

        return {
          error: null,
        };
      };

      provider.registerOnAcceptHook(onAccepted);

      const defaultNoteName =
        initialValue ??
        path.basename(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
          ".md"
        );

      lc.show({
        title: `Create Note with Type ${"hello"}`,
        placeholder: "Enter Note Name",
        provider,
        initialValue: defaultNoteName,
        // nonInteractive: opts?.nonInteractive,
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
