import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
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
import { LookupControllerV3 } from "../../../../../src/components/lookup/LookupControllerV3";
import { NoteLookupProviderFactory } from "../../../../../src/components/lookup/LookupProviderV3Factory";
import { ExtensionProvider } from "../../../../../src/ExtensionProvider";
import { TwoWayBinding } from "../../../../utils/TwoWayBinding";
import { WSUtilsV2 } from "../../../../../src/WSUtilsV2";
import { VaultSelectionMode } from "../../../../components/lookup/types";
import { expect } from "../../../testUtilsv2";
import { describeMultiWS } from "../../../testUtilsV3";

describe(`GIVEN a LookupControllerV3`, () => {
  const viewModel = {
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

  describeMultiWS(
    "GIVEN a LookupControllerV3",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      const buttons = [
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

      const controller = new LookupControllerV3({
        nodeType: "note",
        buttons,
        title: "Test Quick Pick",
        viewModel,
      });

      describe(`WHEN journal mode is toggled`, () => {
        test(`THEN the contents of the quick pick update with 'journal'`, async () => {
          const engine = ExtensionProvider.getEngine();

          await WSUtilsV2.instance().openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          const provider = new NoteLookupProviderFactory(
            ExtensionProvider.getExtension()
          ).create("test", {
            allowNewNote: true,
          });

          controller.prepareQuickPick({
            placeholder: "foo",
            provider,
            initialValue: "foo",
            nonInteractive: true,
            alwaysShow: true,
          });

          viewModel.nameModifierMode.value = LookupNoteTypeEnum.journal;

          const qp = controller.quickPick;
          expect(qp.value.startsWith("foo.journal.")).toBeTruthy();

          // Now untoggle the button:
          viewModel.nameModifierMode.value = LookupNoteTypeEnum.none;
          expect(qp.value).toEqual("foo");
        });
      });

      describe(`WHEN scratch mode is toggled`, () => {
        test(`THEN the contents of the quick pick update with 'scratch'`, async () => {
          const engine = ExtensionProvider.getEngine();

          await WSUtilsV2.instance().openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          const provider = new NoteLookupProviderFactory(
            ExtensionProvider.getExtension()
          ).create("test", {
            allowNewNote: true,
          });

          controller.prepareQuickPick({
            placeholder: "foo",
            provider,
            initialValue: "foo",
            nonInteractive: true,
            alwaysShow: true,
          });

          viewModel.nameModifierMode.value = LookupNoteTypeEnum.scratch;

          const qp = controller.quickPick;
          expect(qp.value.startsWith("scratch.")).toBeTruthy();

          // Now untoggle the button:
          viewModel.nameModifierMode.value = LookupNoteTypeEnum.none;
          expect(qp.value).toEqual("foo");
        });
      });

      describe(`WHEN task mode is toggled`, () => {
        test(`THEN the contents of the quick pick update with 'task.'`, async () => {
          const engine = ExtensionProvider.getEngine();

          await WSUtilsV2.instance().openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          const provider = new NoteLookupProviderFactory(
            ExtensionProvider.getExtension()
          ).create("test", {
            allowNewNote: true,
          });

          controller.prepareQuickPick({
            placeholder: "foo",
            provider,
            initialValue: "foo",
            nonInteractive: true,
            alwaysShow: true,
          });

          viewModel.nameModifierMode.value = LookupNoteTypeEnum.task;

          const qp = controller.quickPick;
          expect(qp.value.startsWith("task.")).toBeTruthy();

          // Now untoggle the button:
          viewModel.nameModifierMode.value = LookupNoteTypeEnum.none;
          expect(qp.value).toEqual("foo");
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN a LookupControllerV3 with selection2Link enabled at the start",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      const buttons = [
        VaultSelectButton.create({ pressed: false }),
        MultiSelectBtn.create({ pressed: false }),
        CopyNoteLinkBtn.create(false),
        DirectChildFilterBtn.create(false),
        SelectionExtractBtn.create({ pressed: false }),
        Selection2LinkBtn.create(true),
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

      const controller = new LookupControllerV3({
        nodeType: "note",
        buttons,
        title: "Test Quick Pick",
        viewModel,
      });

      describe(`WHEN journal mode is toggled on/off when selection2Link is already enabled`, () => {
        test(`THEN the contents of the quick pick restore to the original selection2Link value properly`, async () => {
          const engine = ExtensionProvider.getEngine();

          const fooNoteEditor = await WSUtilsV2.instance().openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          // selects "foo body"
          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);

          const provider = new NoteLookupProviderFactory(
            ExtensionProvider.getExtension()
          ).create("test", {
            allowNewNote: true,
          });

          controller.prepareQuickPick({
            placeholder: "foo",
            provider,
            initialValue: "foo",
            nonInteractive: true,
            alwaysShow: true,
          });

          const qp = controller.quickPick;
          expect(qp.value).toEqual("foo.foo-body");

          // Toggle the journal Button
          viewModel.nameModifierMode.value = LookupNoteTypeEnum.journal;
          expect(qp.value.startsWith("foo.journal.")).toBeTruthy();

          // Now untoggle the button:
          viewModel.nameModifierMode.value = LookupNoteTypeEnum.none;
          expect(qp.value).toEqual("foo.foo-body");
        });
      });
    }
  );
});
