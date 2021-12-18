import {
  ConfigUtils,
  DNodeProps,
  DNodeUtils,
  DVault,
  getSlugger,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { LinkUtils, ParseLinkV2Resp } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { QuickInputButton, ThemeIcon } from "vscode";
import { EngineAPIService } from "../../services/EngineAPIService";
import { NoteSyncService } from "../../services/NoteSyncService";
import { clipboard } from "../../utils";
import { DendronClientUtilsV2 } from "../../clientUtils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace, getEngine, getExtension } from "../../workspace";
import {
  DendronQuickPickerV2,
  LookupEffectType,
  LookupFilterType,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  LookupSplitType,
  VaultSelectionMode,
} from "./types";
import { NotePickerUtils, PickerUtilsV2 } from "./utils";
import { WSUtils } from "../../WSUtils";
import { VaultSelectionModeKeeper } from "./vaultSelectionModeKeeper";

export type ButtonType =
  | LookupEffectType
  | LookupNoteType
  | LookupSelectionType
  | LookupSplitType
  | LookupFilterType
  | "other";

export type ButtonCategory =
  | "selection"
  | "note"
  | "split"
  | "filter"
  | "effect"
  | "other";

export type ButtonHandleOpts = { quickPick: DendronQuickPickerV2 };

export function getButtonCategory(button: DendronBtn): ButtonCategory {
  if (isSelectionBtn(button)) {
    return "selection";
  }
  if (isNoteBtn(button)) {
    return "note";
  }
  if (isSplitButton(button)) {
    return "split";
  }
  if (isFilterButton(button)) {
    return "filter";
  }
  if (isEffectButton(button)) {
    return "effect";
  }
  if (button.type === "other") {
    return "other";
  }
  throw Error(`unknown btn type ${button}`);
}

function isEffectButton(button: DendronBtn) {
  return _.includes(
    ["copyNoteLink", "copyNoteRef", "multiSelect"],
    button.type
  );
}
function isFilterButton(button: DendronBtn) {
  return _.includes(["directChildOnly"], button.type);
}

function isSelectionBtn(button: DendronBtn) {
  return _.includes(
    ["selection2link", "selectionExtract", "selection2Items"],
    button.type
  );
}

function isNoteBtn(button: DendronBtn) {
  return _.includes(["journal", "scratch", "task"], button.type);
}

function isSplitButton(button: DendronBtn) {
  return _.includes(["horizontal", "vertical"], button.type);
}

const selectionToNoteProps = async (opts: {
  selectionType: string;
  note: NoteProps;
}) => {
  const ext = getExtension();
  const resp = await VSCodeUtils.extractRangeFromActiveEditor();
  const { document, range } = resp || {};
  const { selectionType, note } = opts;
  const { selection, text } = VSCodeUtils.getSelection();

  switch (selectionType) {
    case "selectionExtract": {
      if (!_.isUndefined(document)) {
        const ws = getDWorkspace();
        const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
        const noteLookupConfig = lookupConfig.note;
        const leaveTrace = noteLookupConfig.leaveTrace || false;
        const body = "\n" + document.getText(range).trim();
        note.body = body;
        // don't delete if original file is not in workspace
        if (!ext.workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
          return note;
        }
        if (leaveTrace) {
          const editor = VSCodeUtils.getActiveTextEditor();
          const link = NoteUtils.createWikiLink({
            note,
            useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(
              getEngine()
            ),
            alias: { mode: "title" },
          });
          await editor?.edit((builder) => {
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(selection, `!${link}`);
            }
          });
        } else {
          await VSCodeUtils.deleteRange(document, range as vscode.Range);
        }
      }
      return note;
    }
    case "selection2link": {
      if (!_.isUndefined(document)) {
        const editor = VSCodeUtils.getActiveTextEditor();
        if (editor) {
          await editor.edit((builder) => {
            const link = note.fname;
            if (!_.isUndefined(selection) && !selection.isEmpty) {
              builder.replace(selection, `[[${text}|${link}]]`);
            }
          });
          // Because the window switches too quickly, note sync service
          // sometimes can't update the current note with the link fast enough.
          // So we manually force the update here instead.

          const currentNote = WSUtils.getNoteFromDocument(editor.document);
          if (currentNote) {
            await NoteSyncService.instance().updateNoteContents({
              oldNote: currentNote,
              content: editor.document.getText(),
              fmChangeOnly: false,
              fname: currentNote.fname,
              vault: currentNote.vault,
            });
          }
        }
      }
      return note;
    }
    default: {
      return note;
    }
  }
};

export type IDendronQuickInputButton = QuickInputButton & {
  type: ButtonType;
  description: string;
  pressed: boolean;
  onLookup: (payload: any) => Promise<void>;
};

type DendronBtnCons = {
  title: string;
  description: string;
  iconOff: string;
  iconOn: string;
  type: ButtonType;
  pressed?: boolean;
  canToggle?: boolean;
};
export class DendronBtn implements IDendronQuickInputButton {
  public iconPathNormal: ThemeIcon;
  public iconPathPressed: ThemeIcon;
  public type: ButtonType;
  public description: string;
  public pressed: boolean;
  public canToggle: boolean;
  public title: string;
  public opts: DendronBtnCons;

  onLookup = async (_payload: any) => {
    return;
  };

  constructor(opts: DendronBtnCons) {
    const { iconOff, iconOn, type, title, description, pressed } = opts;
    this.iconPathNormal = new vscode.ThemeIcon(iconOff);
    this.iconPathPressed = new vscode.ThemeIcon(iconOn);
    this.type = type;
    this.description = description;
    this.pressed = pressed || false;
    this.title = title;
    this.canToggle = _.isUndefined(opts.canToggle) ? true : opts.canToggle;
    this.opts = opts;
  }

  clone(): DendronBtn {
    return new DendronBtn({
      ...this.opts,
    });
  }

  async onEnable(_opts: ButtonHandleOpts): Promise<void> {
    return undefined;
  }

  async onDisable(_opts: ButtonHandleOpts): Promise<void> {
    return undefined;
  }

  get iconPath() {
    return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
  }

  get tooltip(): string {
    return this.description
      ? `${this.title}, ${this.description}, status: ${
          this.pressed ? "on" : "off"
        }`
      : `${this.title}, status: ${this.pressed ? "on" : "off"}`;
  }

  toggle() {
    if (this.canToggle) {
      this.pressed = !this.pressed;
    }
  }
}

export class Selection2LinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new Selection2LinkBtn({
      title: "Selection to Link",
      description:
        "Highlighted text will be turned into a wikilink to the newly created note",
      iconOff: "link",
      iconOn: "menu-selection",
      type: "selection2link",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNoteProps({
        selectionType: "selection2link",
        note,
      });
    };

    quickPick.prevValue = quickPick.value;
    const { text } = VSCodeUtils.getSelection();
    const slugger = getSlugger();
    quickPick.selectionModifierValue = slugger.slug(text!);
    if (quickPick.noteModifierValue || quickPick.prefix) {
      quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    } else {
      quickPick.value = [
        quickPick.rawValue,
        NotePickerUtils.getPickerValue(quickPick),
      ].join(".");
    }
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = undefined;
    quickPick.selectionModifierValue = undefined;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }
}

export class SelectionExtractBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new SelectionExtractBtn({
      title: "Selection Extract",
      description:
        "Highlighted text will be copied over to the new note and a note reference will be left in the original note",
      iconOff: "find-selection",
      iconOn: "menu-selection",
      type: "selectionExtract",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNoteProps({
        selectionType: "selectionExtract",
        note,
      });
    };
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.selectionProcessFunc = undefined;
    return;
  }
}

export class Selection2ItemsBtn extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new Selection2ItemsBtn({
      title: "Selection to Items",
      description:
        "Wikilinks in highlighted text will be used to create selectable items in lookup",
      iconOff: "checklist",
      iconOn: "menu-selection",
      type: "selection2Items",
      pressed,
      canToggle,
    });
  }

  getNotesFromWikiLinks(opts: {
    wikiLinks: ParseLinkV2Resp[];
    engine: EngineAPIService;
  }) {
    const { wikiLinks, engine } = opts;
    const { vaults, notes, wsRoot } = engine;

    let out: DNodeProps[] = [];
    wikiLinks.forEach((wikiLink) => {
      const fname = wikiLink.sameFile
        ? (PickerUtilsV2.getFnameForOpenEditor() as string)
        : wikiLink.value;

      const vault = wikiLink.vaultName
        ? (VaultUtils.getVaultByName({
            vname: wikiLink.vaultName,
            vaults,
          }) as DVault)
        : undefined;

      if (vault) {
        const note = NoteUtils.getNoteByFnameV5({
          fname,
          notes,
          vault,
          wsRoot,
        });
        if (note) {
          out.push(note);
        }
      } else {
        const notesWithSameFname = NoteUtils.getNotesByFname({
          fname,
          notes,
        });
        out = out.concat(notesWithSameFname);
      }
    });
    return out;
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    const engine = getEngine();
    const { vaults, schemas, wsRoot } = engine;

    // get selection
    const { text } = VSCodeUtils.getSelection();
    const wikiLinks = LinkUtils.extractWikiLinks(text as string);

    // dedupe wikilinks by value
    const uniqueWikiLinks = _.uniqBy(wikiLinks, "value");

    // make a list of picker items from wikilinks
    const notesFromWikiLinks = this.getNotesFromWikiLinks({
      wikiLinks: uniqueWikiLinks,
      engine,
    });
    const pickerItemsFromSelection = notesFromWikiLinks.map(
      (note: DNodeProps) =>
        DNodeUtils.enhancePropForQuickInputV3({
          props: note,
          schemas,
          vaults,
          wsRoot,
        })
    );
    quickPick.prevValue = quickPick.value;
    quickPick.value = "";
    quickPick.itemsFromSelection = pickerItemsFromSelection;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    quickPick.itemsFromSelection = undefined;
    return;
  }
}

export class JournalBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new JournalBtn({
      title: "Create Journal Note",
      description: "",
      iconOff: "calendar",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.journal,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName("JOURNAL");
    };
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.noteModifierValue = undefined;
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = quickPick.rawValue;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
  }
}

export class ScratchBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new ScratchBtn({
      title: "Create Scratch Note",
      description: "",
      iconOff: "new-file",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.scratch,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName("SCRATCH");
    };
    quickPick.prevValue = quickPick.value;
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.noteModifierValue = undefined;
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = quickPick.rawValue;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
  }
}

export class TaskBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new TaskBtn({
      title: "Create Task Note",
      description: "",
      iconOff: "diff-added",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.task,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = () => {
      return DendronClientUtilsV2.genNoteName(LookupNoteTypeEnum.task);
    };
    quickPick.prevValue = quickPick.value;
    const { noteName, prefix } = quickPick.modifyPickerValueFunc();
    quickPick.noteModifierValue = _.difference(
      noteName.split("."),
      prefix.split(".")
    ).join(".");
    quickPick.prefix = prefix;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
    // If the lookup value ends up being identical to the current note, this will be confusing for the user because
    // they won't be able to create a new note. This can happen with the default settings of Task notes.
    // In that case, we add a trailing dot to suggest that they need to type something more.
    const activeName = WSUtils.getActiveNote()?.fname;
    if (quickPick.value === activeName) quickPick.value = `${quickPick.value}.`;
    // Add default task note props to the created note
    quickPick.onCreate = async (note) => {
      note.custom = {
        ...TaskNoteUtils.genDefaultTaskNoteProps(
          note,
          ConfigUtils.getTask(getDWorkspace().config)
        ).custom,
        ...note.custom,
      };
      return note;
    };
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.modifyPickerValueFunc = undefined;
    quickPick.noteModifierValue = undefined;
    quickPick.prevValue = quickPick.value;
    quickPick.prefix = quickPick.rawValue;
    quickPick.value = NotePickerUtils.getPickerValue(quickPick);
  }
}

export class HorizontalSplitBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new HorizontalSplitBtn({
      title: "Split Horizontal",
      description: "Open lookup result to the side",
      iconOff: "split-horizontal",
      iconOn: "menu-selection",
      type: "horizontal",
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.showNote = async (uri) =>
      vscode.window.showTextDocument(uri, {
        viewColumn: vscode.ViewColumn.Beside,
      });
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.showNote = async (uri) => vscode.window.showTextDocument(uri);
    return;
  }
}

export class DirectChildFilterBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DirectChildFilterBtn({
      title: "Direct Child Filter",
      description:
        "Limits lookup depth to one level and filters out stub notes",
      iconOff: "git-branch",
      iconOn: "menu-selection",
      type: "directChildOnly" as LookupFilterType,
      pressed,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.showDirectChildrenOnly = true;
    quickPick.filterMiddleware = (items: NoteQuickInput[]) => items;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.showDirectChildrenOnly = false;
    quickPick.filterMiddleware = undefined;
    return;
  }
}

export class MultiSelectBtn extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new MultiSelectBtn({
      title: "Multi-Select",
      description: "Select multiple notes at once",
      iconOff: "chrome-maximize",
      iconOn: "menu-selection",
      type: "multiSelect" as LookupEffectType,
      pressed,
      canToggle,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.canSelectMany = this.pressed;
    return;
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.canSelectMany = this.pressed;
  }
}

export class CopyNoteLinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new CopyNoteLinkBtn({
      title: "Copy Note Link",
      description: "Add selected notes to the clipboard as wikilinks",
      iconOff: "clippy",
      iconOn: "menu-selection",
      type: "copyNoteLink" as LookupEffectType,
      pressed,
      // Setting this to TRUE to retain any previous behavior. Previously DendronBtn
      // would always overwrite the canToggle to TRUE. Even though this code branch
      // used to set it to FALSE.
      canToggle: true,
    });
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    quickPick.copyNoteLinkFunc = async (items: NoteProps[]) => {
      const links = items.map((note) =>
        NoteUtils.createWikiLink({ note, alias: { mode: "title" } })
      );
      if (_.isEmpty(links)) {
        vscode.window.showInformationMessage(`no items selected`);
      } else {
        await clipboard.writeText(links.join("\n"));
        vscode.window.showInformationMessage(`${links.length} links copied`);
      }
    };
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    quickPick.copyNoteLinkFunc = undefined;
  }
}

export class VaultSelectButton extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    return new VaultSelectButton({
      title: "Select Vault",
      description: "",
      iconOff: "package",
      iconOn: "menu-selection",
      type: "other" as LookupEffectType,
      pressed: opts.pressed,
      canToggle: opts.canToggle,
    });
  }

  get tooltip(): string {
    return `${this.title}, status: ${this.pressed ? "always prompt" : "smart"}`;
  }

  setNextPicker({
    quickPick,
    mode,
  }: {
    quickPick: DendronQuickPickerV2;
    mode: VaultSelectionMode;
  }) {
    quickPick.nextPicker = async (opts: { note: NoteProps }) => {
      const { note } = opts;
      const currentVault = PickerUtilsV2.getVaultForOpenEditor();
      const vaultSelection = await PickerUtilsV2.getOrPromptVaultForNewNote({
        vault: currentVault,
        fname: note.fname,
        vaultSelectionMode: mode,
      });

      if (_.isUndefined(vaultSelection)) {
        vscode.window.showInformationMessage("Note creation cancelled.");
        return;
      }

      return vaultSelection;
    };
  }

  async onEnable({ quickPick }: ButtonHandleOpts) {
    await this.setMode({ quickPick, mode: VaultSelectionMode.alwaysPrompt });
  }

  async onDisable({ quickPick }: ButtonHandleOpts) {
    await this.setMode({ quickPick, mode: VaultSelectionMode.smart });
  }

  private async setMode({
    quickPick,
    mode,
  }: {
    quickPick: DendronQuickPickerV2;
    mode: VaultSelectionMode;
  }) {
    VaultSelectionModeKeeper.recordDeviationFromConfig(mode);

    this.setNextPicker({ quickPick, mode });
  }
}

export function createAllButtons(
  typesToTurnOn: ButtonType[] = []
): DendronBtn[] {
  const buttons = [
    MultiSelectBtn.create({}),
    CopyNoteLinkBtn.create(),
    DirectChildFilterBtn.create(),
    SelectionExtractBtn.create(),
    Selection2LinkBtn.create(),
    Selection2ItemsBtn.create({}),
    JournalBtn.create(),
    ScratchBtn.create(),
    HorizontalSplitBtn.create(),
    // VerticalSplitBtn.create(),
  ];
  typesToTurnOn.map((btnType) => {
    (_.find(buttons, { type: btnType }) as DendronBtn).pressed = true;
  });
  return buttons;
}
