import { DNodePropsQuickInputV2, DVault, NoteUtils, Time } from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4, sinon } from "@dendronhq/common-test-utils";
import {
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  TestEngineUtils
} from "@dendronhq/engine-test-utils";
import { getActiveEditorBasename, TIMEOUT } from "../testUtils";
import _ from "lodash";
import { describe } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { LookupNoteTypeEnum, LookupSelectionTypeEnum, LookupSplitTypeEnum, LookupEffectTypeEnum } from "../../commands/LookupCommand";
import { NoteLookupCommand, CommandOutput } from "../../commands/NoteLookupCommand";
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
  withConfig
} from "../testUtilsV3";
import { DendronWorkspace } from "../../workspace";
import { CONFIG } from "../../constants";

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
  return _.map(
    typeArray,
    (btnType) => {
      return getButtonByType(btnType, buttons);
    }
  )
}

function getSelectionTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  selection2linkBtn: Selection2LinkBtn,
  selectionExtractBtn: SelectionExtractBtn,
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
  journalBtn: JournalBtn,
  scratchBtn: ScratchBtn
} {
  const [journalBtn, scratchBtn] = getButtonsByTypeArray(
    _.values(LookupNoteTypeEnum), 
    buttons,
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { journalBtn, scratchBtn };
}

function getSplitTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  horizontalSplitBtn: HorizontalSplitBtn,
} {
  const [horizontalSplitBtn] = getButtonsByTypeArray(
    _.values(LookupSplitTypeEnum),
    buttons,
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { horizontalSplitBtn };
}

function getEffectTypeButtons(
  buttons: vscode.QuickInputButton[] & DendronBtn[]
): {
  copyNoteLinkBtn: CopyNoteLinkBtn
} {
  // copyNoteLinkBtn only for now
  const [copyNoteLinkBtn] = getButtonsByTypeArray(
    _.values(LookupEffectTypeEnum),
    buttons,
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

  // NOTE: think these tests are wrong
  describe("updateItems", () => {
    test("picker has value of opened note by default", (done) => {
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

    test("direct child filter", (done) => {
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
          expect(out.quickpick.value).toEqual(`foo.journal.${today}`)

          done();
        }
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
          expect(out.quickpick.value.startsWith(`scratch.${today.split(".").slice(0, -1).join(".")}.`)).toBeTruthy();

          done();
        }
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
            noteType: LookupNoteTypeEnum.journal
          });

          controller.quickpick.show();
          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          )

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
        }
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
            noteType: LookupNoteTypeEnum.scratch
          });

          controller.quickpick.show();
          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          )

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
        }
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
            noteType: LookupNoteTypeEnum.journal
          });

          controller.quickpick.show();
          let { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          )

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
        }
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
          const newNote = VSCodeUtils.getNoteFromDocument(newNoteEditor.document);
          expect(newNote?.body).toEqual("");

          // should change selection to link with alais.
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.endsWith("[[foo body|foo.foo-body]]\n"));
          done();
        }
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

          controller.quickpick.show();

          let { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

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
        }
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
          const newNote = VSCodeUtils.getNoteFromDocument(newNoteEditor.document);
          expect(newNote?.body.trim()).toEqual("foo body");

          // should remove selection
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.includes("foo body")).toBeFalsy();
          done();
        }
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

          controller.quickpick.show();

          let { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(selection2linkBtn?.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeTruthy();
          
          await controller.onTriggerButton(selectionExtractBtn);

          ({ selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          ));

          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();

          done();
        }
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

          controller.quickpick.show();

          let { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

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
        }
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
          })
          const fooChildEditor = VSCodeUtils.getActiveTextEditor();
          expect(fooChildEditor!.viewColumn).toEqual(3);

          done();
        }
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
            splitType: "horizontal"
          });

          controller.quickpick.show();

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
        }
      });
    });

    test("copyNoteLink basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            initialValue: "foo"
          });
          controller.quickpick.show();

          const { copyNoteLinkBtn } = getEffectTypeButtons(
            controller.quickpick.buttons
          );

          // hack: need to wait here a bit.
          // TODO: A more elegant way to do this.
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await controller.onTriggerButton(copyNoteLinkBtn);

          const content = await clipboard.readText();
          expect(content).toEqual("[[Foo|foo]]");

          done();
        }
      }); 
    });
  });
});
