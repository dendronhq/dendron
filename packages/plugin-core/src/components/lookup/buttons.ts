import {
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  MODIFIER_DESCRIPTIONS,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  DendronBtn,
  LookupEffectType,
  LookupSplitType,
  LookupFilterType,
} from "./ButtonTypes";
import { DendronQuickPickerV2 } from "./types";

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

export class Selection2LinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new Selection2LinkBtn({
      title: "Selection to Link",
      description: MODIFIER_DESCRIPTIONS["selection2link"],
      iconOff: "link",
      iconOn: "menu-selection",
      type: "selection2link",
      pressed,
    });
  }
}

export class SelectionExtractBtn extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new SelectionExtractBtn({
      title: "Selection Extract",
      description: MODIFIER_DESCRIPTIONS["selectionExtract"],
      iconOff: "find-selection",
      iconOn: "menu-selection",
      type: "selectionExtract",
      pressed,
      canToggle,
    });
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
      description: MODIFIER_DESCRIPTIONS["selection2Items"],
      iconOff: "checklist",
      iconOn: "menu-selection",
      type: "selection2Items",
      pressed,
      canToggle,
    });
  }
}

export class JournalBtn extends DendronBtn {
  static create(opts?: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new JournalBtn({
      title: "Create Journal Note",
      description: MODIFIER_DESCRIPTIONS["journal"],
      iconOff: "calendar",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.journal,
      pressed,
      canToggle,
    });
  }
}

export class ScratchBtn extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    const { pressed, canToggle } = _.defaults(opts, {
      pressed: false,
      canToggle: true,
    });
    return new ScratchBtn({
      title: "Create Scratch Note",
      description: MODIFIER_DESCRIPTIONS["scratch"],
      iconOff: "new-file",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.scratch,
      pressed,
      canToggle,
    });
  }
}

export class TaskBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new TaskBtn({
      title: "Create Task Note",
      description: MODIFIER_DESCRIPTIONS["task"],
      iconOff: "diff-added",
      iconOn: "menu-selection",
      type: LookupNoteTypeEnum.task,
      pressed,
    });
  }
}

export class HorizontalSplitBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new HorizontalSplitBtn({
      title: "Split Horizontal",
      description: MODIFIER_DESCRIPTIONS["horizontal"],
      iconOff: "split-horizontal",
      iconOn: "menu-selection",
      type: "horizontal",
      pressed,
    });
  }
}

export class DirectChildFilterBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new DirectChildFilterBtn({
      title: "Direct Child Filter",
      description: MODIFIER_DESCRIPTIONS["directChildOnly"],
      iconOff: "git-branch",
      iconOn: "menu-selection",
      type: "directChildOnly" as LookupFilterType,
      pressed,
    });
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
      description: MODIFIER_DESCRIPTIONS["multiSelect"],
      iconOff: "chrome-maximize",
      iconOn: "menu-selection",
      type: "multiSelect" as LookupEffectType,
      pressed,
      canToggle,
    });
  }
}

export class CopyNoteLinkBtn extends DendronBtn {
  static create(pressed?: boolean) {
    return new CopyNoteLinkBtn({
      title: "Copy Note Link",
      description: MODIFIER_DESCRIPTIONS["copyNoteLink"],
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
}

export class VaultSelectButton extends DendronBtn {
  static create(opts: { pressed?: boolean; canToggle?: boolean }) {
    return new VaultSelectButton({
      title: "Select Vault",
      description: "",
      iconOff: "package",
      iconOn: "menu-selection",
      type: "selectVault",
      pressed: opts.pressed,
      canToggle: opts.canToggle,
    });
  }

  get tooltip(): string {
    return `${this.title}, status: ${this.pressed ? "always prompt" : "smart"}`;
  }
}

export function createAllButtons(
  typesToTurnOn: ButtonType[] = []
): DendronBtn[] {
  const buttons = [
    MultiSelectBtn.create({}),
    CopyNoteLinkBtn.create(),
    DirectChildFilterBtn.create(),
    SelectionExtractBtn.create({}),
    Selection2LinkBtn.create(),
    Selection2ItemsBtn.create({}),
    JournalBtn.create(),
    ScratchBtn.create({}),
    HorizontalSplitBtn.create(),
    // VerticalSplitBtn.create(),
  ];
  typesToTurnOn.map((btnType) => {
    (_.find(buttons, { type: btnType }) as DendronBtn).pressed = true;
  });
  return buttons;
}
