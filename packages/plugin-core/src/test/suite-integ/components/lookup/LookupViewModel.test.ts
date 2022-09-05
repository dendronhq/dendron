import {
  DNodePropsQuickInputV2,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { after, before, describe, it } from "mocha";
import * as vscode from "vscode";
import {
  CopyNoteLinkBtn,
  DirectChildFilterBtn,
  HorizontalSplitBtn,
  JournalBtn,
  MultiSelectBtn,
  ScratchBtn,
  Selection2ItemsBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
  TaskBtn,
  VaultSelectButton,
} from "../../../../../src/components/lookup/buttons";
import { ILookupViewModel } from "../../../../../src/components/lookup/LookupViewModel";
import { LookupV3QuickPickView } from "../../../../../src/components/views/LookupV3QuickPickView";
import { TwoWayBinding } from "../../../../utils/TwoWayBinding";
import {
  ButtonType,
  DendronBtn,
} from "../../../../components/lookup/ButtonTypes";
import {
  DendronQuickPickerV2,
  VaultSelectionMode,
} from "../../../../components/lookup/types";
import { expect } from "../../../testUtilsv2";

const isButtonPressed = function (type: ButtonType, buttons: DendronBtn[]) {
  const button = _.find(buttons, (value) => value.type === type)!;
  return button.pressed;
};

describe(`GIVEN a LookupV3QuickPick`, () => {
  const qp =
    vscode.window.createQuickPick<DNodePropsQuickInputV2>() as DendronQuickPickerV2;

  qp.buttons = [
    VaultSelectButton.create({ pressed: false }),
    MultiSelectBtn.create({ pressed: false }),
    CopyNoteLinkBtn.create(false),
    DirectChildFilterBtn.create(false),
    SelectionExtractBtn.create({ pressed: false }),
    Selection2LinkBtn.create(false),
    Selection2ItemsBtn.create({
      pressed: false,
    }),
    JournalBtn.create({
      pressed: false,
    }),
    ScratchBtn.create({
      pressed: false,
    }),
    TaskBtn.create(false),
    HorizontalSplitBtn.create(false),
  ];

  const viewModel: ILookupViewModel = {
    selectionState: new TwoWayBinding<LookupSelectionTypeEnum>(
      LookupSelectionTypeEnum.none
    ),
    vaultSelectionMode: new TwoWayBinding<VaultSelectionMode>(
      VaultSelectionMode.auto
    ),
    isMultiSelectEnabled: new TwoWayBinding<boolean>(false),
    isCopyNoteLinkEnabled: new TwoWayBinding<boolean>(false),
    isApplyDirectChildFilter: new TwoWayBinding<boolean>(false),
    nameModifierMode: new TwoWayBinding<LookupNoteTypeEnum>(
      LookupNoteTypeEnum.none
    ),
    isSplitHorizontally: new TwoWayBinding<boolean>(false),
  };

  let viewToTest: LookupV3QuickPickView | undefined;
  before(() => {
    viewToTest = new LookupV3QuickPickView(qp, viewModel);
  });

  after(() => {
    if (viewToTest) {
      viewToTest.dispose();
      viewToTest = undefined;
    }
  });

  describe(`WHEN mode changed to selection2Items`, () => {
    it(`THEN selection2Items button checked and Extract and toLink buttons unchecked`, () => {
      viewModel.selectionState.value = LookupSelectionTypeEnum.selection2Items;
      expect(isButtonPressed("selection2Items", qp.buttons)).toBeTruthy();
      expect(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN mode changed to selection2Link`, () => {
    it(`THEN selection2Link button checked and Extract and toItems buttons unchecked`, () => {
      viewModel.selectionState.value = LookupSelectionTypeEnum.selection2link;

      expect(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selection2link", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN mode changed to selection2Extract`, () => {
    it(`THEN selection2Extract button checked and toItems and toLink buttons unchecked`, () => {
      viewModel.selectionState.value = LookupSelectionTypeEnum.selectionExtract;

      expect(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selectionExtract", qp.buttons)).toBeTruthy();
      expect(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN mode changed to None`, () => {
    it(`THEN extract, toItems, toLink buttons all unchecked`, () => {
      viewModel.selectionState.value = LookupSelectionTypeEnum.none;

      expect(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
      expect(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN vaultSelection is alwaysPrompt`, () => {
    it(`THEN vaultSelection button is checked`, () => {
      viewModel.vaultSelectionMode.value = VaultSelectionMode.alwaysPrompt;
      expect(isButtonPressed("selectVault", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN vaultSelection is smart`, () => {
    it(`THEN vaultSelection button is unchecked`, () => {
      viewModel.vaultSelectionMode.value = VaultSelectionMode.smart;
      expect(isButtonPressed("selectVault", qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN multiSelect is enabled`, () => {
    it(`THEN multiSelect button is checked`, () => {
      viewModel.isMultiSelectEnabled.value = true;

      expect(isButtonPressed("multiSelect", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN multiSelect is disabled`, () => {
    it(`THEN multiSelect button is unchecked`, () => {
      viewModel.isMultiSelectEnabled.value = false;

      expect(isButtonPressed("multiSelect", qp.buttons)).toBeFalsy();
    });
  });

  // Copy Note Link State
  describe(`WHEN copyNoteLink is enabled`, () => {
    it(`THEN copyNoteLink button is checked`, () => {
      viewModel.isCopyNoteLinkEnabled.value = true;

      expect(isButtonPressed("copyNoteLink", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN copyNoteLink is disabled`, () => {
    it(`THEN copyNoteLink button is unchecked`, () => {
      viewModel.isCopyNoteLinkEnabled.value = false;

      expect(isButtonPressed("copyNoteLink", qp.buttons)).toBeFalsy();
    });
  });

  // Direct Child Only state
  describe(`WHEN directChildOnly is enabled`, () => {
    it(`THEN directChildOnly button is checked`, () => {
      viewModel.isApplyDirectChildFilter.value = true;

      expect(isButtonPressed("directChildOnly", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN directChildOnly is disabled`, () => {
    it(`THEN directChildOnly button is unchecked`, () => {
      viewModel.isApplyDirectChildFilter.value = false;

      expect(isButtonPressed("directChildOnly", qp.buttons)).toBeFalsy();
    });
  });

  // Horizontal Split state
  describe(`WHEN horizontal split is enabled`, () => {
    it(`THEN horizontal button is checked`, () => {
      viewModel.isSplitHorizontally.value = true;

      expect(isButtonPressed("horizontal", qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN horizontal split is disabled`, () => {
    it(`THEN horizontal button is unchecked`, () => {
      viewModel.isSplitHorizontally.value = false;

      expect(isButtonPressed("horizontal", qp.buttons)).toBeFalsy();
    });
  });

  // Name Modifier Options (Journal / Scratch / Task):
  describe(`WHEN name modifier mode changed to Journal`, () => {
    it(`THEN journal button checked and scratch and task buttons unchecked`, () => {
      viewModel.nameModifierMode.value = LookupNoteTypeEnum.journal;
      expect(
        isButtonPressed(LookupNoteTypeEnum.journal, qp.buttons)
      ).toBeTruthy();
      expect(
        isButtonPressed(LookupNoteTypeEnum.scratch, qp.buttons)
      ).toBeFalsy();
      expect(isButtonPressed(LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN name modifier mode changed to Scratch`, () => {
    it(`THEN scratch button checked and journal and task buttons unchecked`, () => {
      viewModel.nameModifierMode.value = LookupNoteTypeEnum.scratch;
      expect(
        isButtonPressed(LookupNoteTypeEnum.journal, qp.buttons)
      ).toBeFalsy();
      expect(
        isButtonPressed(LookupNoteTypeEnum.scratch, qp.buttons)
      ).toBeTruthy();
      expect(isButtonPressed(LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
    });
  });

  describe(`WHEN name modifier mode changed to Task`, () => {
    it(`THEN task button checked and journal and scratch buttons unchecked`, () => {
      viewModel.nameModifierMode.value = LookupNoteTypeEnum.task;
      expect(
        isButtonPressed(LookupNoteTypeEnum.journal, qp.buttons)
      ).toBeFalsy();
      expect(
        isButtonPressed(LookupNoteTypeEnum.scratch, qp.buttons)
      ).toBeFalsy();
      expect(isButtonPressed(LookupNoteTypeEnum.task, qp.buttons)).toBeTruthy();
    });
  });

  describe(`WHEN name modifier mode changed to None`, () => {
    it(`THEN journal, scratch, task buttons all unchecked`, () => {
      viewModel.nameModifierMode.value = LookupNoteTypeEnum.none;
      expect(
        isButtonPressed(LookupNoteTypeEnum.journal, qp.buttons)
      ).toBeFalsy();
      expect(
        isButtonPressed(LookupNoteTypeEnum.scratch, qp.buttons)
      ).toBeFalsy();
      expect(isButtonPressed(LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
    });
  });
});
