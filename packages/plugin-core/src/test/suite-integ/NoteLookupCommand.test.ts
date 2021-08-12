import {
  DNodePropsQuickInputV2,
  DVault,
  DNodeUtils,
  NoteUtils,
  NoteQuickInput,
  Time,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import {
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  TestEngineUtils,
} from "@dendronhq/engine-test-utils";
import {
  createMockQuickPick,
  getActiveEditorBasename,
  TIMEOUT,
} from "../testUtils";
import _ from "lodash";
import { describe } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  LookupSplitTypeEnum,
  LookupEffectTypeEnum,
} from "../../commands/LookupCommand";
import {
  NoteLookupCommand,
  CommandOutput,
  CommandRunOpts,
} from "../../commands/NoteLookupCommand";
import {
  JournalBtn,
  ScratchBtn,
  DendronBtn,
  ButtonType,
  Selection2LinkBtn,
  SelectionExtractBtn,
  CopyNoteLinkBtn,
  HorizontalSplitBtn,
} from "../../components/lookup/buttons";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { clipboard, VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";
import { DendronWorkspace } from "../../workspace";
import { CONFIG } from "../../constants";
import sinon from "sinon";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: "vault1" });
  sinon.stub(PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
  return vault;
};

// @ts-ignore
function expectCreateNew({
  item,
  fname,
}: {
  item: DNodePropsQuickInputV2;
  fname?: string;
}) {
  expect(item.title).toEqual("Create New");
  if (fname) {
    expect(item.fname).toEqual(fname);
  }
}

function getButtonByType(
  btnType: ButtonType,
  buttons: vscode.QuickInputButton[] & DendronBtn[]
) {
  return _.find(buttons, (button) => {
    return button.type === btnType;
  });
}

function getButtonsByTypeArray(
  typeArray: ButtonType[],
  buttons: vscode.QuickInputButton[] & DendronBtn[]
) {
  return _.map(typeArray, (btnType) => {
    return getButtonByType(btnType, buttons);
  });
}

function getSelectionTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  selection2linkBtn: Selection2LinkBtn;
  selectionExtractBtn: SelectionExtractBtn;
} {
  const [selection2linkBtn, selectionExtractBtn] = getButtonsByTypeArray(
    _.values(LookupSelectionTypeEnum),
    buttons
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { selection2linkBtn, selectionExtractBtn };
}

function getNoteTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  journalBtn: JournalBtn;
  scratchBtn: ScratchBtn;
} {
  const [journalBtn, scratchBtn] = getButtonsByTypeArray(
    _.values(LookupNoteTypeEnum),
    buttons
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { journalBtn, scratchBtn };
}

function getSplitTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  horizontalSplitBtn: HorizontalSplitBtn;
} {
  const [horizontalSplitBtn] = getButtonsByTypeArray(
    _.values(LookupSplitTypeEnum),
    buttons
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { horizontalSplitBtn };
}

function getEffectTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  copyNoteLinkBtn: CopyNoteLinkBtn;
} {
  // copyNoteLinkBtn only for now
  const [copyNoteLinkBtn] = getButtonsByTypeArray(
    _.values(LookupEffectTypeEnum),
    buttons
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { copyNoteLinkBtn };
}

suite("NoteLookupCommand", function () {
  this.timeout(TIMEOUT);
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    afterHook: async () => {
      sinon.restore();
    },
  });

  const getTodayInScratchDateFormat = () => {
    const dateFormat = DendronWorkspace.configuration().get<string>(
      CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key
    ) as string;
    const today = Time.now().toFormat(dateFormat);
    return today.split(".").slice(0, -1).join(".");
  };

  // NOTE: think these tests are wrong
  describe("updateItems", () => {
    test("direct child filter", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NOTE_PRESETS_V4.NOTE_SIMPLE_GRANDCHILD.create({
            wsRoot,
            vault: TestEngineUtils.vault1(vaults),
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            fname: "foo.ch2",
            vault: vaults[0],
            props: { stub: true },
          });
        },
        onInit: async ({ vaults, engine: _engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foo.",
            filterMiddleware: ["directChildOnly"],
          }))!;
          // Doesn't find grandchildren
          expect(
            _.find(opts.quickpick.selectedItems, { fname: "foo.ch1.gch1" })
          ).toEqual(undefined);
          // Doesn't find stubs
          expect(
            _.find(opts.quickpick.selectedItems, { fname: "foo.ch2" })
          ).toEqual(undefined);
          expect(_.isUndefined(opts.quickpick.filterMiddleware)).toBeFalsy();
          done();
        },
      });
    });

    test("picker has value of opened note by default", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await VSCodeUtils.openNote(engine.notes["foo"]);
          const opts = (await cmd.run({ noConfirm: true }))!;
          expect(opts.quickpick.value).toEqual("foo");
          expect(_.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
          done();
        },
      });
    });

    test("schema suggestions basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          const vpath = vault2Path({ vault: vaults[0], wsRoot });
          fs.removeSync(path.join(vpath, "foo.ch1.md"));
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller, provider, quickpick } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.journal,
          });

          quickpick.value = "foo.";
          await provider.onUpdatePickerItems({
            picker: quickpick,
            token: controller.cancelToken.token,
            fuzzThreshold: controller.fuzzThreshold,
          });
          const schemaItem = _.pick(
            _.find(quickpick.items, { fname: "foo.ch1" }),
            ["fname", "schemaStub"]
          );
          expect(schemaItem).toEqual({
            fname: "foo.ch1",
            schemaStub: true,
          });
          done();
        },
      });
    })
  });

  describe("onAccept", () => {
    // TODO: needs to update so for noConfirm, we pick last value, not first value
    test.skip("new node", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foobar",
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(4);
          expect(_.last(opts.quickpick.selectedItems)?.title).toEqual(
            "Create New"
          );
          expect(
            VSCodeUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            )?.fname
          ).toEqual("foobar");
          done();
        },
      });

      test("new node, stub", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ vaults, wsRoot }) => {
            const vault = TestEngineUtils.vault1(vaults);
            await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
              vault,
              wsRoot,
            });
          },
          onInit: async ({ vaults, engine, wsRoot }) => {
            const cmd = new NoteLookupCommand();
            const vault = TestEngineUtils.vault1(vaults);
            stubVaultPick(vaults);
            const opts = (await cmd.run({
              noConfirm: true,
              initialValue: "foo",
            }))!;
            expect(_.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
            NoteUtils.getNoteOrThrow({
              fname: "foo",
              notes: engine.notes,
              vault,
              wsRoot,
            });
            done();
          },
        });
      });

      test("regular multi-select, no pick new", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
          onInit: async ({ vaults }) => {
            const vault = _.find(vaults, { fsPath: "vault2" });
            const cmd = new NoteLookupCommand();
            sinon
              .stub(PickerUtilsV2, "promptVault")
              .returns(Promise.resolve(vault));
            const opts = (await cmd.run({
              noConfirm: true,
              initialValue: "foobar",
              multiSelect: true,
            }))!;
            expect(opts.quickpick.selectedItems.length).toEqual(3);
            expect(_.last(opts.quickpick.selectedItems)?.title).toNotEqual(
              "Create New"
            );
            done();
          },
        });

        test("lookupConfirmVaultOnCreate = true, existing vault", (done) => {
          runLegacyMultiWorkspaceTest({
            ctx,
            preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
            onInit: async ({ wsRoot, vaults }) => {
              withConfig(
                (config) => {
                  config.lookupConfirmVaultOnCreate = true;
                  return config;
                },
                { wsRoot }
              );

              const fname = NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.fname;
              const vault = _.find(vaults, { fsPath: "vault2" });
              const cmd = new NoteLookupCommand();
              sinon
                .stub(PickerUtilsV2, "promptVault")
                .returns(Promise.resolve(vault));
              const { quickpick } = (await cmd.run({
                noConfirm: true,
                initialValue: fname,
                fuzzThreshold: 1,
              }))!;
              // should have next pick
              expect(_.isUndefined(quickpick?.nextPicker)).toBeFalsy();
              // selected items shoudl equal
              expect(quickpick.selectedItems.length).toEqual(1);
              expect(
                _.pick(quickpick.selectedItems[0], ["id", "vault"])
              ).toEqual({
                id: fname,
                vault,
              });
              done();
            },
          });
        });
      });
    });
  });

  describe("modifiers", () => {
    test("journal note basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          // with journal note modifier enabled,
          await VSCodeUtils.openNote(engine.notes["foo"]);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          })) as CommandOutput;

          expect(engine.config.journal.dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          expect(out.quickpick.value).toEqual(`foo.journal.${today}`);

          done();
        },
      });
    });

    test("scratch note basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          // with scratch note modifier enabled,
          await VSCodeUtils.openNote(engine.notes["foo"]);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.scratch,
            noConfirm: true,
          })) as CommandOutput;

          // quickpick value should be `scratch.yyyy.mm.dd.ts`
          const dateFormat = DendronWorkspace.configuration().get<string>(
            CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key
          ) as string;
          const today = Time.now().toFormat(dateFormat);
          const todayFormatted = today.split(".").slice(0, -1).join(".");
          expect(
            out.quickpick.value.startsWith(`scratch.${todayFormatted}.`)
          ).toBeTruthy();

          done();
        },
      });
    });

    test("journal modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await VSCodeUtils.openNote(engine.notes["foo"]);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.journal,
          });

          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value.startsWith("foo.journal."));

          await controller.onTriggerButton(journalBtn);

          ({ journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("scratch modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await VSCodeUtils.openNote(engine.notes["foo"]);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.scratch,
          });

          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeTruthy();
          expect(controller.quickpick.value.startsWith("scratch."));

          await controller.onTriggerButton(scratchBtn);

          ({ journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("scratch and journal modifiers toggle each other off when triggered", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await VSCodeUtils.openNote(engine.notes["foo"]);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.journal,
          });

          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value.startsWith("foo.journal."));

          await controller.onTriggerButton(scratchBtn);

          ({ journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeTruthy();
          expect(controller.quickpick.value.startsWith("scratch."));

          await controller.onTriggerButton(scratchBtn);

          ({ journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("selection2link basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

          // selects "foo body"
          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          await cmd.run({
            selectionType: "selection2link",
            noConfirm: true,
          });

          // should create foo.foo-body.md with an empty body.
          expect(getActiveEditorBasename().endsWith("foo.foo-body.md"));
          const newNoteEditor = VSCodeUtils.getActiveTextEditorOrThrow();
          const newNote = VSCodeUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body).toEqual("");

          // should change selection to link with alais.
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.endsWith("[[foo body|foo.foo-body]]\n"));
          done();
        },
      });
    });

    test("selection2link modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          const { controller } = await cmd.gatherInputs({
            selectionType: "selection2link",
          });

          let { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(controller.quickpick.buttons);

          expect(selection2linkBtn?.pressed).toBeTruthy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo.foo-body");

          await controller.onTriggerButton(selection2linkBtn);

          ({ selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          ));

          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("selectionExtract basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

          // selects "foo body"
          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          await cmd.run({
            selectionType: "selectionExtract",
            initialValue: "foo.extracted",
            noConfirm: true,
          });

          // should create foo.extracted.md with an selected text as body.
          expect(getActiveEditorBasename().endsWith("foo.extracted.md"));
          const newNoteEditor = VSCodeUtils.getActiveTextEditorOrThrow();
          const newNote = VSCodeUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body.trim()).toEqual("foo body");

          // should remove selection
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.includes("foo body")).toBeFalsy();
          done();
        },
      });
    });

    test("selectionExtract modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          const { controller } = await cmd.gatherInputs({
            selectionType: "selectionExtract",
          });

          let { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(controller.quickpick.buttons);

          expect(selection2linkBtn?.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(selectionExtractBtn);

          ({ selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          ));

          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();

          done();
        },
      });
    });

    test("selection2link and selectionExtract modifiers toggle each other off when triggered", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          const { controller } = await cmd.gatherInputs({
            selectionType: "selection2link",
          });

          let { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(controller.quickpick.buttons);

          expect(selection2linkBtn?.pressed).toBeTruthy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo.foo-body");

          await controller.onTriggerButton(selectionExtractBtn);

          ({ selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          ));

          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeTruthy();
          expect(controller.quickpick.value).toEqual("foo");

          await controller.onTriggerButton(selectionExtractBtn);

          ({ selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          ));

          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("horizontal split basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          // close all editors before running.
          VSCodeUtils.closeAllEditors();

          await VSCodeUtils.openNote(engine.notes["foo"]);
          await cmd.run({
            initialValue: "bar",
            splitType: "horizontal",
            noConfirm: true,
          });
          const barEditor = VSCodeUtils.getActiveTextEditor();
          expect(barEditor!.viewColumn).toEqual(2);

          await cmd.run({
            initialValue: "foo.ch1",
            splitType: "horizontal",
            noConfirm: true,
          });
          const fooChildEditor = VSCodeUtils.getActiveTextEditor();
          expect(fooChildEditor!.viewColumn).toEqual(3);

          done();
        },
      });
    });

    test("horizontal split modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            splitType: "horizontal",
          });

          let { horizontalSplitBtn } = getSplitTypeButtons(
            controller.quickpick.buttons
          );

          expect(horizontalSplitBtn?.pressed).toBeTruthy();

          await controller.onTriggerButton(horizontalSplitBtn);

          ({ horizontalSplitBtn } = getSplitTypeButtons(
            controller.quickpick.buttons
          ));

          expect(horizontalSplitBtn.pressed).toBeFalsy();

          done();
        },
      });
    });

    // TODO: fix later.
    test.skip("copyNoteLink basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const { controller } = await cmd.gatherInputs({
            initialValue: "foo",
          });
          const { copyNoteLinkBtn } = getEffectTypeButtons(
            controller.quickpick.buttons
          );

          await controller.onTriggerButton(copyNoteLinkBtn);
          const content = await clipboard.readText();
          expect(content).toEqual("[[Foo|foo]]");

          done();
        },
      });
    });
  });

  describe("journal + selection2link interactions", () => {
    const prepareCommandFunc = async ({ vaults, engine }: any) => {
      const cmd = new NoteLookupCommand();
      stubVaultPick(vaults);

      const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

      // selects "foo body"
      fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
      const { text } = VSCodeUtils.getSelection();
      expect(text).toEqual("foo body");

      const { controller } = await cmd.gatherInputs({
        noteType: LookupNoteTypeEnum.journal,
        selectionType: LookupSelectionTypeEnum.selection2link,
      });
      return { controller };
    };

    test("journal and selection2link both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          expect(controller.quickpick.value).toEqual(
            `foo.journal.${today}.foo-body`
          );

          done();
        },
      });
    });

    test("toggling journal modifier off will only leave selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(journalBtn);
          expect(controller.quickpick.value).toEqual(`foo.foo-body`);

          done();
        },
      });
    });

    test("toggling selection2link modifier off will only leave journal modifier applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(selection2linkBtn);
          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          expect(controller.quickpick.value).toEqual(`foo.journal.${today}`);

          done();
        },
      });
    });

    test("applying scratch strips journal modifier, and keeps selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(scratchBtn);
          const dateFormat = DendronWorkspace.configuration().get<string>(
            CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key
          ) as string;
          const today = Time.now().toFormat(dateFormat);
          const todayFormatted = today.split(".").slice(0, -1).join(".");
          const quickpickValue = controller.quickpick.value;
          expect(
            quickpickValue.startsWith(`scratch.${todayFormatted}`)
          ).toBeTruthy();
          expect(quickpickValue.endsWith(`.foo-body`)).toBeTruthy();

          done();
        },
      });
    });
  });

  describe("scratch + selection2link interactions", () => {
    const prepareCommandFunc = async ({ vaults, engine }: any) => {
      const cmd = new NoteLookupCommand();
      stubVaultPick(vaults);

      const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

      // selects "foo body"
      fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
      const { text } = VSCodeUtils.getSelection();
      expect(text).toEqual("foo body");

      const { controller } = await cmd.gatherInputs({
        noteType: LookupNoteTypeEnum.scratch,
        selectionType: LookupSelectionTypeEnum.selection2link,
      });
      return { controller };
    };

    test("scratch and selection2link both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(scratchBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          const todayFormatted = getTodayInScratchDateFormat();
          const quickpickValue = controller.quickpick.value;
          expect(
            quickpickValue.startsWith(`scratch.${todayFormatted}`)
          ).toBeTruthy();
          expect(quickpickValue.endsWith(".foo-body")).toBeTruthy();

          done();
        },
      });
    });

    test("toggling scratch modifier off will only leave selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(scratchBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(scratchBtn);
          expect(controller.quickpick.value).toEqual(`foo.foo-body`);

          done();
        },
      });
    });

    test("toggling selection2link modifier off will only leave scratch modifier applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(scratchBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(selection2linkBtn);
          const todayFormatted = getTodayInScratchDateFormat();
          const quickpickValue = controller.quickpick.value;
          expect(
            quickpickValue.startsWith(`scratch.${todayFormatted}`)
          ).toBeTruthy();
          expect(quickpickValue.endsWith(".foo-body")).toBeFalsy();

          done();
        },
      });
    });

    test("applying journal strips scratch modifier, and keeps selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(scratchBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(journalBtn);
          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          const quickpickValue = controller.quickpick.value;
          expect(quickpickValue).toEqual(`foo.journal.${today}.foo-body`);

          done();
        },
      });
    });
  });

  describe("note modifiers + selectionExtract interactions", () => {
    const prepareCommandFunc = async ({ vaults, engine, noteType }: any) => {
      const cmd = new NoteLookupCommand();
      stubVaultPick(vaults);

      const fooNoteEditor = await VSCodeUtils.openNote(engine.notes["foo"]);

      // selects "foo body"
      fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
      const { text } = VSCodeUtils.getSelection();
      expect(text).toEqual("foo body");

      const cmdOut = await cmd.run({
        noteType,
        selectionType: LookupSelectionTypeEnum.selectionExtract,
        noConfirm: true,
      });
      return { cmdOut, selectedText: text };
    };

    test("journal + selectionExtract both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          const { selectedText } = await prepareCommandFunc({
            vaults,
            engine,
            noteType: LookupNoteTypeEnum.journal,
          });

          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          const newNote = NoteUtils.getNoteOrThrow({
            fname: `foo.journal.${today}`,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });

          expect(newNote.body.trim()).toEqual(selectedText);

          done();
        },
      });
    });

    test("scratch + selectionExtract both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          const { cmdOut, selectedText } = await prepareCommandFunc({
            vaults,
            engine,
            noteType: LookupNoteTypeEnum.scratch,
          });

          const newNote = NoteUtils.getNoteOrThrow({
            fname: cmdOut!.quickpick.value,
            notes: engine.notes,
            vault: vaults[0],
            wsRoot,
          });
          expect(newNote.body.trim()).toEqual(selectedText);

          done();
        },
      });
    });
  });

  describe("multiselect interactions", () => {
    // TODO: there's gotta be a better way to mock this.
    const prepareCommandFunc = async ({
      wsRoot,
      vaults,
      engine,
      opts,
    }: any) => {
      const cmd = new NoteLookupCommand();
      const notesToSelect = ["foo.ch1", "bar", "lorem", "ipsum"].map(
        (fname) => engine.notes[fname]
      );
      const selectedItems = notesToSelect.map((note) => {
        return DNodeUtils.enhancePropForQuickInputV3({
          props: note,
          schemas: engine.schemas,
          wsRoot,
          vaults,
        });
      }) as NoteQuickInput[];

      const runOpts = {
        multiSelect: true,
        noConfirm: true,
      } as CommandRunOpts;

      if (opts.split) runOpts.splitType = LookupSplitTypeEnum.horizontal;

      const gatherOut = await cmd.gatherInputs(runOpts);

      const mockQuickPick = createMockQuickPick({
        value: "",
        selectedItems,
        canSelectMany: true,
        buttons: gatherOut.quickpick.buttons,
      });

      if (opts.copyLink) {
        const { copyNoteLinkBtn } = getEffectTypeButtons(mockQuickPick.buttons);
        sinon.stub(gatherOut.controller, "_quickpick").value(mockQuickPick);
        sinon.stub(gatherOut.controller, "quickpick").value(mockQuickPick);
        await gatherOut.controller.onTriggerButton(copyNoteLinkBtn);
        const content = await clipboard.readText();
        sinon.restore();
        return { content };
      }

      mockQuickPick.showNote = gatherOut.quickpick.showNote;

      sinon.stub(cmd, "enrichInputs").returns(
        Promise.resolve({
          quickpick: mockQuickPick,
          controller: gatherOut.controller,
          provider: gatherOut.provider,
          selectedItems,
        })
      );
      return { cmd };
    };

    test("split + multiselect: should have n+1 columns", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            fname: "lorem",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createNote({
            fname: "ipsum",
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          // make clean slate.
          VSCodeUtils.closeAllEditors();

          await VSCodeUtils.openNote(engine.notes["foo"]);
          const { cmd } = await prepareCommandFunc({
            wsRoot,
            vaults,
            engine,
            opts: { split: true },
          });

          await cmd!.run({
            multiSelect: true,
            splitType: LookupSplitTypeEnum.horizontal,
            noConfirm: true,
          });
          const editor = VSCodeUtils.getActiveTextEditor();
          // one open, lookup with 2 selected. total 3 columns.
          expect(editor?.viewColumn).toEqual(5);
          sinon.restore();
          done();
        },
      });
    });

    // FIX: doesn't work
    // clipboard testing is flaky
    test("copyNoteLink + multiselect: should copy link of all selected notes", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NoteTestUtilsV4.createNote({
            fname: "lorem",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createNote({
            fname: "ipsum",
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          // make clean slate.
          VSCodeUtils.closeAllEditors();

          await VSCodeUtils.openNote(engine.notes["foo"]);

          const { content } = await prepareCommandFunc({
            wsRoot,
            vaults,
            engine,
            opts: { copyLink: true },
          });

          expect(content).toEqual(
            [
              "[[Ch1|foo.ch1]]",
              "[[Bar|bar]]",
              "[[Lorem|lorem]]",
              "[[Ipsum|ipsum]]",
            ].join("\n")
          );
          done();
        },
      });
    });
  });
});
