import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  NoteProps,
} from "@dendronhq/common-all";
import { ENGINE_HOOKS, TestEngineUtils } from "@dendronhq/engine-test-utils";
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
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

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

          await controller.prepareQuickPick({
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

          await controller.prepareQuickPick({
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

          await controller.prepareQuickPick({
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

          await controller.prepareQuickPick({
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

  suite("selection2Items", () => {
    let active: NoteProps;
    let activeWithAmbiguousLink: NoteProps;
    let activeWithNonUniqueLinks: NoteProps;
    describeMultiWS(
      "GIVEN a LookupControllerV3 with Selection2Items enabled at the start",
      {
        preSetupHook: async ({ vaults, wsRoot }) => {
          await ENGINE_HOOKS.setupBasic({ vaults, wsRoot });
          active = await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "active",
            body: "[[dendron.ginger]]\n[[dendron.dragonfruit]]\n[[dendron.clementine]]",
          });
          activeWithAmbiguousLink = await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "active-ambiguous",
            body: "[[pican]]",
          });
          activeWithNonUniqueLinks = await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "active-dedupe",
            body: "[[dendron.ginger]]\n\n[[Ginger|dendron.ginger]]\n\n[[Lots of Ginger|dendron.ginger]]\n\n",
          });
          await NoteTestUtilsV4.createNote({
            genRandomId: true,
            vault: TestEngineUtils.vault2(vaults),
            wsRoot,
            fname: "pican",
            body: "",
          });
          await NoteTestUtilsV4.createNote({
            genRandomId: true,
            vault: TestEngineUtils.vault3(vaults),
            wsRoot,
            fname: "pican",
            body: "",
          });
          await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "dendron.ginger",
            body: "",
          });
          await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "dendron.dragonfruit",
            body: "",
          });
          await NoteTestUtilsV4.createNote({
            vault: TestEngineUtils.vault1(vaults),
            wsRoot,
            fname: "dendron.clementine",
            body: "",
          });
        },
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
            pressed: true,
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

        describe(`GIVEN an active note with selection that contains wikilinks`, () => {
          test(`THEN quickpick is populated with notes that were selected.`, async () => {
            const editor = await WSUtilsV2.instance().openNote(active);
            editor.selection = new vscode.Selection(7, 0, 10, 0);

            const provider = new NoteLookupProviderFactory(
              ExtensionProvider.getExtension()
            ).create("test", {
              allowNewNote: true,
            });

            await controller.prepareQuickPick({
              placeholder: "foo",
              provider,
              initialValue: "foo",
              nonInteractive: true,
              alwaysShow: true,
            });
            const { onSelect2ItemsBtnToggled } =
              controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
            await onSelect2ItemsBtnToggled(true);

            const expectedItemLabels = [
              "dendron.ginger",
              "dendron.dragonfruit",
              "dendron.clementine",
            ];
            const actualItemLabels =
              controller.quickPick.itemsFromSelection!.map(
                (item) => item.label
              );

            expect(expectedItemLabels).toEqual(actualItemLabels);
          });

          test(`THEN if selected wikilink's vault is ambiguous, list all notes with same fname across all vaults.`, async () => {
            const editor = await WSUtilsV2.instance().openNote(
              activeWithAmbiguousLink
            );
            editor.selection = new vscode.Selection(7, 0, 8, 0);

            const provider = new NoteLookupProviderFactory(
              ExtensionProvider.getExtension()
            ).create("test", {
              allowNewNote: true,
            });

            await controller.prepareQuickPick({
              placeholder: "foo",
              provider,
              initialValue: "foo",
              nonInteractive: true,
              alwaysShow: true,
            });
            const { onSelect2ItemsBtnToggled } =
              controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
            await onSelect2ItemsBtnToggled(true);

            const expectedItemLabels = ["pican", "pican"];
            const actualItemLabels =
              controller.quickPick.itemsFromSelection!.map(
                (item) => item.label
              );

            expect(expectedItemLabels).toEqual(actualItemLabels);
          });

          test(`THEN if selection contains links that point to same note, correctly dedupes them`, async () => {
            const editor = await WSUtilsV2.instance().openNote(
              activeWithNonUniqueLinks
            );
            editor.selection = new vscode.Selection(7, 0, 10, 0);

            const provider = new NoteLookupProviderFactory(
              ExtensionProvider.getExtension()
            ).create("test", {
              allowNewNote: true,
            });

            await controller.prepareQuickPick({
              placeholder: "foo",
              provider,
              initialValue: "foo",
              nonInteractive: true,
              alwaysShow: true,
            });
            const { onSelect2ItemsBtnToggled } =
              controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
            await onSelect2ItemsBtnToggled(true);

            const expectedItemLabels = ["dendron.ginger"];
            const actualItemLabels =
              controller.quickPick.itemsFromSelection!.map(
                (item) => item.label
              );

            expect(expectedItemLabels).toEqual(actualItemLabels);
          });
        });
      }
    );
  });
});
