import {
  IntermediateDendronConfig,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  LegacyLookupSelectionType,
  NoteQuickInput,
  NoteUtils,
  Time,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  EngineTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { HistoryService } from "@dendronhq/engine-server";
import {
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  TestEngineUtils,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  LookupSplitTypeEnum,
} from "../../components/lookup/types";
import {
  CommandOutput,
  CommandRunOpts,
  NoteLookupCommand,
} from "../../commands/NoteLookupCommand";
import {
  ButtonType,
  DendronBtn,
  HorizontalSplitBtn,
  JournalBtn,
  ScratchBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
} from "../../components/lookup/buttons";
import {
  createNoActiveItem,
  NotePickerUtils,
  PickerUtilsV2,
} from "../../components/lookup/utils";
import { CONFIG } from "../../constants";
import { clipboard, VSCodeUtils } from "../../utils";
import { DendronExtension } from "../../workspace";
import { createMockQuickPick, getActiveEditorBasename } from "../testUtils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";
import { CREATE_NEW_LABEL } from "../../components/lookup/constants";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: "vault1" });
  return sinon
    .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
    .returns(Promise.resolve(vault));
};

function expectCreateNew({
  item,
  fname,
}: {
  item: DNodePropsQuickInputV2;
  fname?: string;
}) {
  if (item.label !== CREATE_NEW_LABEL) {
    throw new Error(
      `Actual item='${JSON.stringify(
        item
      )}' did NOT have label='${CREATE_NEW_LABEL}'`
    );
  }
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

async function wait1Second(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

suite("NoteLookupCommand", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  const getTodayInScratchDateFormat = () => {
    const dateFormat = DendronExtension.configuration().get<string>(
      CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key
    ) as string;
    const today = Time.now().toFormat(dateFormat);
    return today.split(".").slice(0, -1).join(".");
  };

  describe("enrichInputs", () => {
    test("edge, quickpick cleans up when hidden", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async () => {
          const cmd = new NoteLookupCommand();
          const opts = await cmd.gatherInputs();
          const out = cmd.enrichInputs(opts);
          expect(
            HistoryService.instance().subscribersv2.lookupProvider.length
          ).toEqual(1);
          // delicate test
          setTimeout(async () => {
            opts.quickpick.hide();
            await out;
            expect(
              HistoryService.instance().subscribersv2.lookupProvider.length
            ).toEqual(0);
            done();
          }, 1000);
          // await out;
        },
      });
    });
  });

  // NOTE: think these tests are wrong
  describe("updateItems", () => {
    test("empty querystring", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "",
          }))!;
          expect(
            !_.isUndefined(
              _.find(opts.quickpick.selectedItems, { fname: "root" })
            )
          ).toBeTruthy();
          expect(
            !_.isUndefined(
              _.find(opts.quickpick.selectedItems, { fname: "foo" })
            )
          ).toBeTruthy();
          done();
        },
      });
    });

    test("star query", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "*",
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(6);
          done();
        },
      });
    });

    test(`WHEN partial match but not exact match THEN bubble up 'Create New'`, (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foo.ch",
          }))!;
          // Check that Create New comes first.
          expectCreateNew({ item: opts.quickpick.selectedItems[0] });

          // Check that its not just create new in the quick pick.
          expect(opts.quickpick.selectedItems.length > 1).toBeTruthy();
          done();
        },
      });
    });

    test("domain query with schema", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await cmd.run({
            noConfirm: true,
            initialValue: "foo",
          })!;
          const editor = VSCodeUtils.getActiveTextEditor();
          const actualNote = VSCodeUtils.getNoteFromDocument(editor!.document);
          const expectedNote = engine.notes["foo"];
          expect(actualNote).toEqual(expectedNote);
          expect(actualNote!.schema).toEqual({
            moduleId: "foo",
            schemaId: "foo",
          });
          done();
        },
      });
    });

    test("child query with schema", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await cmd.run({
            noConfirm: true,
            initialValue: "foo.ch1",
          })!;
          const editor = VSCodeUtils.getActiveTextEditor();
          const actualNote = VSCodeUtils.getNoteFromDocument(editor!.document);
          const expectedNote = engine.notes["foo.ch1"];
          expect(actualNote).toEqual(expectedNote);
          expect(actualNote!.schema).toEqual({
            moduleId: "foo",
            schemaId: "ch1",
          });
          done();
        },
      });
    });

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
        onInit: async ({ vaults }) => {
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
    });
  });

  describe("onAccept", () => {
    test("new node", (done) => {
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
          expect(opts.quickpick.selectedItems.length).toEqual(1);
          const lastItem = _.last(opts.quickpick.selectedItems);
          expect(_.pick(lastItem, ["id", "fname"])).toEqual({
            id: "Create New",
            fname: "foobar",
          });
          expect(
            VSCodeUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            )?.fname
          ).toEqual("foobar");
          done();
        },
      });
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

    test("new domain", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await cmd.run({
            noConfirm: true,
            initialValue: "bar",
          })!;
          const barFromEngine = engine.notes["bar"];
          const editor = VSCodeUtils.getActiveTextEditor()!;
          const activeNote = VSCodeUtils.getNoteFromDocument(editor.document);
          expect(activeNote).toEqual(barFromEngine);
          expect(
            DNodeUtils.isRoot(engine.notes[barFromEngine.parent as string])
          );
          done();
        },
      });
    });

    test("regular multi-select, no pick new", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ vaults, wsRoot }) => {
          const vault = _.find(vaults, { fsPath: "vault2" });
          const cmd = new NoteLookupCommand();
          sinon.stub(PickerUtilsV2, "getVaultForOpenEditor").returns(vault!);

          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foobar",
            multiSelect: true,
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(0);
          expect(_.last(opts.quickpick.selectedItems)?.title).toNotEqual(
            "Create New"
          );
          expect(
            await EngineTestUtilsV4.checkVault({
              wsRoot,
              vault: vault!,
              match: ["foobar.md"],
            })
          ).toBeTruthy();
          done();
        },
      });
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
          // One item for our file name and the other for 'CreateNew' since there
          // are multiple vaults in this test.
          expect(quickpick.selectedItems.length).toEqual(2);
          expect(_.pick(quickpick.selectedItems[0], ["id", "vault"])).toEqual({
            id: fname,
            vault,
          });
          done();
        },
      });
    });

    test("new node with schema template", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await cmd.run({
            initialValue: "bar.ch1",
            noConfirm: true,
          });
          const document = VSCodeUtils.getActiveTextEditor()?.document;
          const newNote = VSCodeUtils.getNoteFromDocument(document!);
          expect(_.trim(newNote!.body)).toEqual("ch1 template");
          expect(newNote?.tags).toEqual("tag-foo");

          done();
        },
      });
    });

    test("new node matching schema prefix defaults to first matching schema child name", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },

        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          await cmd.run({
            initialValue: "foo.",
            noConfirm: true,
          });
          const document = VSCodeUtils.getActiveTextEditor()?.document;
          const newNote = VSCodeUtils.getNoteFromDocument(document!);
          expect(newNote?.fname).toEqual("foo.ch1");

          done();
        },
      });
    });

    test("new node with schema template on namespace", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPresetWithNamespaceTemplate({
            wsRoot,
            vaults,
          });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const gatherOut = await cmd.gatherInputs({
            initialValue: "daily.journal.2021.08.10",
            noConfirm: true,
          });

          const enrichOut = await cmd.enrichInputs(gatherOut);
          const mockQuickPick = createMockQuickPick({
            value: "daily.journal.2021.08.10",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          mockQuickPick.showNote = enrichOut?.quickpick.showNote;

          await cmd.execute({
            ...enrichOut!,
            quickpick: mockQuickPick,
          });
          const document = VSCodeUtils.getActiveTextEditor()?.document;
          const newNote = VSCodeUtils.getNoteFromDocument(document!);
          expect(_.trim(newNote!.body)).toEqual("Template text");

          done();
        },
      });
    });

    test("on accept, nothing selected", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const spyFetchPickerResultsNoInput = sinon.spy(
            NotePickerUtils,
            "fetchPickerResultsNoInput"
          );
          const { quickpick, provider, controller } = await cmd.gatherInputs({
            noConfirm: true,
            initialValue: "foo",
          });
          await provider.onDidAccept({ quickpick, lc: controller })();
          expect(spyFetchPickerResultsNoInput.calledOnce).toBeTruthy();
          done();
        },
      });
    });
  });

  describe("onAccept with lookupConfirmVaultOnCreate", () => {
    const modConfigCb = (config: IntermediateDendronConfig) => {
      config.lookupConfirmVaultOnCreate = true;
      return config;
    };
    test("turned off, existing note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          const promptVaultSpy = stubVaultPick(vaults);
          await cmd.run({ noConfirm: true, initialValue: "foo" });
          expect(promptVaultSpy.calledOnce).toBeFalsy();
          done();
        },
      });
    });
    test("turned off, new note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          const promptVaultSpy = stubVaultPick(vaults);
          await cmd.run({ noConfirm: true, initialValue: "foo" });
          expect(promptVaultSpy.calledOnce).toBeFalsy();
          done();
        },
      });
    });

    test("turned on, existing note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          const promptVaultSpy = stubVaultPick(vaults);
          await cmd.run({ noConfirm: true, initialValue: "foo" });
          expect(promptVaultSpy.calledOnce).toBeFalsy();
          done();
        },
      });
    });

    test("turned on, new note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          const promptVaultSpy = stubVaultPick(vaults);
          await cmd.run({ noConfirm: true, initialValue: "gamma" });
          expect(promptVaultSpy.calledOnce).toBeTruthy();
          done();
        },
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
          const noteName = `foo.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = VSCodeUtils.getNoteFromDocument(
            VSCodeUtils.getActiveTextEditor()!.document
          );

          expect(note?.fname).toEqual(noteName);

          const titleOverride = today.split(".").join("-");
          expect(note!.title).toEqual(titleOverride);

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
          const dateFormat = DendronExtension.configuration().get<string>(
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

    test("Scratch notes created at different times are differently named", (done) => {
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

          const createScratch = async () => {
            const out = (await cmd.run({
              noteType: LookupNoteTypeEnum.scratch,
              noConfirm: true,
            })) as CommandOutput;

            return out.quickpick.value;
          };

          const scratch1Name = await createScratch();
          await wait1Second();
          const scratch2Name = await createScratch();

          expect(scratch1Name).toNotEqual(scratch2Name);

          done();
        },
      });
    });

    // not working
    test.skip("journal note with initial value override", (done) => {
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
            initialValue: "gamma",
            noConfirm: true,
          })) as CommandOutput;

          expect(engine.config.journal.dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(engine.config.journal.dateFormat);
          const noteName = `gamma.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = VSCodeUtils.getNoteFromDocument(
            VSCodeUtils.getActiveTextEditor()!.document
          );
          const titleOverride = today.split(".").join("-");
          expect(note!.title).toEqual(titleOverride);

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

    test("selection modifier set to none in configs", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config: IntermediateDendronConfig) => {
          config.lookup!.note.selectionType =
            "none" as LegacyLookupSelectionType;
          return config;
        },
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const gatherOut = await cmd.gatherInputs({});
          const { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(gatherOut.quickpick.buttons);
          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          done();
        },
      });
    });

    test("selectionType: none in args", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const gatherOut = await cmd.gatherInputs({
            selectionType: LookupSelectionTypeEnum.none,
          });
          const { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(gatherOut.quickpick.buttons);
          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          done();
        },
      });
    });

    test("selectionType is selectionExtract by default", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const gatherOut = await cmd.gatherInputs({});
          const { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(gatherOut.quickpick.buttons);
          expect(selection2linkBtn.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeTruthy();
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

          // Note should have its links updated, since selection2link put a link in it
          const oldNote = engine.notes["foo"];
          expect(oldNote.links.length).toEqual(1);
          expect(oldNote.links[0].value).toEqual("foo.foo-body");
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
    test("leave trace on selectionExtract", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          withConfig(
            (config) => {
              config.lookup!.note.leaveTrace = true;
              return config;
            },
            { wsRoot }
          );
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
          expect(
            changedText.includes(`![[${newNote?.title}|${newNote?.fname}]]`)
          ).toBeTruthy();
          expect(changedText.includes("foo body")).toBeFalsy();
          done();
        },
      });
    });

    test("selectionExtract from file not in known vault", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          // open and create a file outside of vault.
          const extDir = tmpDir().name;
          const extPath = "outside.md";
          const extBody = "non vault content";
          await FileTestUtils.createFiles(extDir, [
            { path: extPath, body: extBody },
          ]);
          const uri = vscode.Uri.file(path.join(extDir, extPath));
          const editor = (await VSCodeUtils.openFileInEditor(
            uri
          )) as vscode.TextEditor;
          editor.selection = new vscode.Selection(0, 0, 0, 17);

          await cmd.run({
            selectionType: "selectionExtract",
            initialValue: "from-outside",
            noConfirm: true,
          });

          const newNoteEditor = VSCodeUtils.getActiveTextEditorOrThrow();
          const newNote = VSCodeUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body.trim()).toEqual("non vault content");

          const nonVaultFileEditor = (await VSCodeUtils.openFileInEditor(
            uri
          )) as vscode.TextEditor;
          expect(nonVaultFileEditor.document.getText()).toEqual(extBody);
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

    test("copyNoteLink basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const out = await cmd.run({
            initialValue: "foo",
            noConfirm: true,
            copyNoteLink: true,
          });
          const content = await clipboard.readText();
          expect(content).toEqual("[[Foo|foo]]");
          expect(!_.isUndefined(out?.quickpick.copyNoteLinkFunc)).toBeTruthy();

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
          const dateFormat = DendronExtension.configuration().get<string>(
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
        copyNoteLink: opts.copyLink ? true : undefined,
      } as CommandRunOpts;

      if (opts.split) runOpts.splitType = LookupSplitTypeEnum.horizontal;

      const gatherOut = await cmd.gatherInputs(runOpts);

      const mockQuickPick = createMockQuickPick({
        value: "",
        selectedItems,
        canSelectMany: true,
        buttons: gatherOut.quickpick.buttons,
      });

      mockQuickPick.showNote = gatherOut.quickpick.showNote;
      mockQuickPick.copyNoteLinkFunc = gatherOut.quickpick.copyNoteLinkFunc;

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

          const { cmd } = await prepareCommandFunc({
            wsRoot,
            vaults,
            engine,
            opts: { copyLink: true },
          });

          await cmd.run({
            multiSelect: true,
            noConfirm: true,
            copyNoteLink: true,
          });

          const content = await clipboard.readText();

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
