import {
  assertUnreachable,
  DendronError,
  NotePropsMeta,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { HistoryEvent } from "@dendronhq/engine-server";
import { LinkUtils, ParseLinkV2Resp } from "@dendronhq/unified";
import _ from "lodash";
import { Disposable, QuickPickItem, Range, TextEditor } from "vscode";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { AutoCompleter } from "../utils/autoCompleter";
import {
  getReferenceAtPosition,
  getReferenceAtPositionResp,
} from "../utils/md";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  range: Range;
  text: string;
};

type CommandOutput = void;

export class ConvertLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_LINK.key;

  static noAvailableOperationError() {
    return new DendronError({
      message: `No available convert operation for link at cursor position.`,
    });
  }

  static noVaultError() {
    return new DendronError({
      message: "this link points to a note in a vault that doesn't exist",
    });
  }

  static noLinkError() {
    return new DendronError({
      message: `No link at cursor position.`,
    });
  }

  static noTextError() {
    return new DendronError({
      message: "Failed to determine text to replace broken link.",
    });
  }

  prepareBrokenLinkConvertOptions(reference: getReferenceAtPositionResp) {
    const parsedLink = LinkUtils.parseLinkV2({
      linkString: reference.refText,
      explicitAlias: true,
    }) as ParseLinkV2Resp;
    const aliasOption: QuickPickItem = {
      label: "Alias",
      description: parsedLink?.alias,
      detail: "Convert broken link to alias text.",
    };
    const hierarchyOption: QuickPickItem = {
      label: "Hierarchy",
      description:
        reference.refType === "usertag" || reference.refType === "hashtag"
          ? reference.ref
          : parsedLink?.value,
      detail: "Convert broken link to hierarchy.",
    };
    const noteNameOption: QuickPickItem = {
      label: "Note name",
      description:
        reference.refType === "usertag" || reference.refType === "hashtag"
          ? _.last(reference.ref.split("."))
          : _.last(parsedLink?.value?.split(".")),
      detail:
        "Convert broken link to note name excluding hierarchy except the basename.",
    };
    const promptOption: QuickPickItem = {
      label: "Prompt",
      detail: "Input plaintext to convert broken link to.",
    };
    const changeDestinationOption: QuickPickItem = {
      label: "Change destination",
      detail: "Lookup existing note to link instead of current broken link.",
    };

    const options: QuickPickItem[] = [
      hierarchyOption,
      noteNameOption,
      promptOption,
      changeDestinationOption,
    ];

    if (parsedLink?.alias) {
      options.unshift(aliasOption);
    }

    return { options, parsedLink };
  }

  async promptBrokenLinkConvertOptions(reference: getReferenceAtPositionResp) {
    const { options, parsedLink } =
      this.prepareBrokenLinkConvertOptions(reference);
    const option = await VSCodeUtils.showQuickPick(options, {
      title: "Pick how you want to convert the broken link.",
      ignoreFocusOut: true,
      canPickMany: false,
    });

    return { option, parsedLink };
  }

  async lookupNewDestination(): Promise<
    NoteLookupProviderSuccessResp | undefined
  > {
    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: true,
      vaultSelectCanToggle: false,
    };
    const extension = ExtensionProvider.getExtension();
    const lc = await extension.lookupControllerFactory.create(lcOpts);
    const provider = extension.noteLookupProviderFactory.create(this.key, {
      allowNewNote: false,
      noHidePickerOnAccept: false,
    });
    return new Promise((resolve) => {
      let disposable: Disposable;

      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller: lc,
        logger: this.L,
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
        title: "Select new note for link destination",
        placeholder: "new note",
        provider,
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

  async promptBrokenLinkUserInput() {
    const text = await VSCodeUtils.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "text to use.",
      prompt:
        "The text submitted here will be used to replace the broken link.",
      title: "Input plaintext to convert broken link to.",
    });
    return text;
  }

  async prepareBrokenLinkOperation(opts: {
    option: QuickPickItem | undefined;
    parsedLink: ParseLinkV2Resp;
    reference: getReferenceAtPositionResp;
  }) {
    const { option, parsedLink, reference } = opts;
    if (_.isUndefined(option)) return;
    let text;
    switch (option.label) {
      case "Alias": {
        text = parsedLink.alias;
        break;
      }
      case "Hierarchy": {
        text = parsedLink.value;
        if (
          reference.refType === "hashtag" ||
          reference.refType === "usertag"
        ) {
          text = reference.ref;
        }
        break;
      }
      case "Note name": {
        text = _.last(parsedLink.value!.split("."));
        if (
          reference.refType === "hashtag" ||
          reference.refType === "usertag"
        ) {
          text = _.last(reference.ref.split("."));
        }
        break;
      }
      case "Prompt": {
        text = this.promptBrokenLinkUserInput();
        break;
      }
      case "Change destination": {
        const resp = await this.lookupNewDestination();
        if (_.isUndefined(resp)) {
          break;
        }
        text = NoteUtils.createWikiLink({
          note: resp?.selectedItems[0] as NotePropsMeta,
          alias: { mode: "title" },
        });
        break;
      }
      default: {
        throw new DendronError({
          message: "Unexpected option selected",
          payload: {
            ctx: "prepareBrokenLinkOperation",
            label: option.label,
          },
        });
      }
    }
    return text;
  }

  async promptConfirmation(opts: { title: string; noConfirm?: boolean }) {
    const { title, noConfirm } = opts;
    if (noConfirm) return true;
    const options = ["Proceed", "Cancel"];
    const resp = await VSCodeUtils.showQuickPick(options, {
      placeHolder: "Proceed",
      ignoreFocusOut: true,
      title,
    });
    return resp === "Proceed";
  }

  async prepareValidLinkOperation(reference: getReferenceAtPositionResp) {
    const { refType, range, ref } = reference;
    switch (refType) {
      case "hashtag":
      case "usertag": {
        const shouldProceed = await this.promptConfirmation({
          title: `Convert ${refType} to wikilink?`,
        });
        if (shouldProceed) {
          return {
            range,
            text: `[[${ref}]]`,
          };
        }
        break;
      }
      case "wiki": {
        let tagType;
        if (ref.startsWith("user")) {
          tagType = "usertag";
        } else if (ref.startsWith("tags")) {
          tagType = "hashtag";
        }

        if (_.isUndefined(tagType)) {
          throw ConvertLinkCommand.noAvailableOperationError();
        }

        const shouldProceed = await this.promptConfirmation({
          title: `Convert wikilink to ${tagType}?`,
        });
        if (shouldProceed) {
          const label = _.drop(ref.split(".")).join(".");
          const text = tagType === "usertag" ? `@${label}` : `#${label}`;
          return {
            range,
            text,
          };
        }
        break;
      }
      case undefined:
      case "fmtag":
      case "refv2": {
        throw ConvertLinkCommand.noAvailableOperationError();
      }
      default: {
        assertUnreachable(refType);
      }
    }
    throw new DendronError({
      message: "cancelled.",
    });
  }

  async gatherInputs(): Promise<CommandOpts> {
    const engine = ExtensionProvider.getEngine();
    const { vaults, wsRoot } = engine;
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const { document, selection } = editor;
    const reference = await getReferenceAtPosition({
      document,
      position: selection.start,
      vaults,
      wsRoot,
      opts: {
        allowInCodeBlocks: true,
      },
    });

    if (reference === null) {
      throw ConvertLinkCommand.noLinkError();
    }

    const { ref, vaultName, range, refType } = reference;
    if (refType === "fmtag") {
      throw ConvertLinkCommand.noAvailableOperationError();
    }
    const targetVault = vaultName
      ? VaultUtils.getVaultByName({ vaults, vname: vaultName })
      : await WSUtils.getVaultFromDocument(document);

    if (targetVault === undefined) {
      throw ConvertLinkCommand.noVaultError();
    } else {
      const targetNote = (
        await engine.findNotesMeta({ fname: ref, vault: targetVault })
      )[0];

      if (targetNote === undefined) {
        const { option, parsedLink } =
          await this.promptBrokenLinkConvertOptions(reference);
        const text = await this.prepareBrokenLinkOperation({
          option,
          parsedLink,
          reference,
        });
        if (_.isUndefined(text)) {
          throw ConvertLinkCommand.noTextError();
        }
        return {
          range,
          text,
        };
      } else {
        const resp = await this.prepareValidLinkOperation(reference);
        return resp;
      }
    }
  }

  async execute(opts: CommandOpts) {
    const { range, text } = opts;
    const editor = VSCodeUtils.getActiveTextEditor()!;
    await editor.edit((editBuilder) => {
      editBuilder.replace(range, text);
    });
    return;
  }
}
