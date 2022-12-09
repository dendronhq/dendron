import {
  ConfigUtils,
  DNodeUtils,
  DVault,
  DendronConfig,
  LookupNoteTypeEnum,
  LookupSelectionModeEnum,
  LookupSelectionTypeEnum,
  NoteProps,
  SchemaTemplate,
  SchemaUtils,
  Time,
  VaultUtils,
  ConfigService,
  URI,
  NoteQuickInputV2,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  EngineTestUtilsV4,
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import { HistoryService, MetadataService } from "@dendronhq/engine-server";
import {
  ENGINE_HOOKS,
  ENGINE_HOOKS_MULTI,
  TestEngineUtils,
} from "@dendronhq/engine-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import sinon, { SinonStub } from "sinon";
import * as vscode from "vscode";
import {
  CommandOutput,
  CommandRunOpts,
  NoteLookupCommand,
} from "../../commands/NoteLookupCommand";
import {
  ButtonType,
  HorizontalSplitBtn,
  JournalBtn,
  ScratchBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
  TaskBtn,
} from "../../components/lookup/buttons";
import {
  DendronBtn,
  LookupSplitTypeEnum,
} from "../../components/lookup/ButtonTypes";
import { CREATE_NEW_LABEL } from "../../components/lookup/constants";
import { NotePickerUtils } from "../../components/lookup/NotePickerUtils";
import { DendronQuickPickerV2 } from "../../components/lookup/types";
import {
  createNoActiveItem,
  PickerUtilsV2,
} from "../../components/lookup/utils";
import { CONFIG } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { clipboard } from "../../utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { createMockQuickPick, getActiveEditorBasename } from "../testUtils";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  waitInMilliseconds,
  withConfig,
} from "../testUtilsV3";
import { WSUtilsV2 } from "../../WSUtilsV2";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: "vault1" });
  return sinon
    .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
    .returns(Promise.resolve(vault));
};

export function expectQuickPick(quickPick: DendronQuickPickerV2 | undefined) {
  if (quickPick === undefined) {
    const message = "quickpick is undefined.";
    return {
      toIncludeFname: (_fname: string) => {
        assert.fail(message);
      },
      toNotIncludeFname: (_fname: string) => {
        assert.fail(message);
      },
      toBeEmpty: () => {
        assert.fail(message);
      },
    };
  }
  return {
    toIncludeFname: (fname: string) => {
      assert.ok(
        quickPick.items.some((item) => item.fname === fname),
        `Did not find item with fname='${fname}' in quick pick when expected to find it.`
      );
    },
    toNotIncludeFname: (fname: string) => {
      assert.ok(
        !quickPick.items.some((item) => item.fname === fname),
        `Found item with fname='${fname}' when expected NOT to find it.`
      );
    },
    toBeEmpty() {
      const errorMsg = `Expected quick pick to be empty but found ${
        quickPick.items.length
      }items: '${quickPick.items.map((item) => item.label)}'`;

      assert.ok(quickPick.items.length === 0, errorMsg);
    },
  };
}

function expectCreateNew({
  item,
  fname,
}: {
  item: NoteQuickInputV2;
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
  taskBtn: TaskBtn;
} {
  const [journalBtn, scratchBtn, taskBtn] = getButtonsByTypeArray(
    _.values(LookupNoteTypeEnum),
    buttons
  ) as vscode.QuickInputButton[] & DendronBtn[];
  return { journalBtn, scratchBtn, taskBtn };
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
            cmd.cleanUp();
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
          cmd.cleanUp();
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
          cmd.cleanUp();
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
          cmd.cleanUp();
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
          const actualNote = await WSUtils.getNoteFromDocument(
            editor!.document
          );
          const expectedNote = (await engine.getNote("foo")).data!;
          expect(actualNote).toEqual(expectedNote);
          expect(actualNote!.schema).toEqual({
            moduleId: "foo",
            schemaId: "foo",
          });
          cmd.cleanUp();
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
          const actualNote = await WSUtils.getNoteFromDocument(
            editor!.document
          );
          const expectedNote = (await engine.getNote("foo.ch1")).data!;
          expect(actualNote).toEqual(expectedNote);
          expect(actualNote!.schema).toEqual({
            moduleId: "foo",
            schemaId: "ch1",
          });

          cmd.cleanUp();
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
            fname: "foo.ch2.gch1",
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
          cmd.cleanUp();
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
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
          const opts = (await cmd.run({ noConfirm: true }))!;
          expect(opts.quickpick.value).toEqual("foo");
          expect(_.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
          cmd.cleanUp();
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
            // fuzzThreshold: controller.fuzzThreshold,
          });
          const schemaItem = _.pick(
            _.find(quickpick.items, { fname: "foo.ch1" }),
            ["fname", "schemaStub"]
          );
          expect(schemaItem).toEqual({
            fname: "foo.ch1",
            schemaStub: true,
          });
          cmd.cleanUp();
          done();
        },
      });
    });
  });

  async function runLookupTest(
    initialValue: string,
    assertions: (out: CommandOutput | undefined) => void
  ) {
    const cmd = new NoteLookupCommand();
    const out = await cmd.run({
      noConfirm: true,
      initialValue,
    });

    assertions(out);
    cmd.cleanUp();
  }

  /**
   * Notes to choose from (root.md excluded):
   *
   <pre>
   vault1/
   ├── bar.ch1.gch1.ggch1.md
   ├── bar.ch1.gch1.md
   ├── bar.ch1.md
   ├── bar.md
   ├── foo.ch1.gch1.ggch1.md
   ├── foo.ch1.gch1.md
   ├── foo.ch1.gch2.md
   ├── foo.ch1.md
   ├── foo.ch2.md
   ├── goo.ends-with-ch1.no-ch1-by-itself.md
   └── foo.md
   </pre>
   * */
  describeMultiWS(
    "GIVEN default note lookup settings:",
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupHierarchyForLookupTests({
          wsRoot,
          vaults,
        });
      },
      timeout: 5e3,
    },
    () => {
      describe("WHEN running simple query", () => {
        test("THEN find the matching value", async () => {
          await runLookupTest("ends-with-ch1", (out) => {
            expectQuickPick(out?.quickpick).toIncludeFname(
              "goo.ends-with-ch1.no-ch1-by-itself"
            );
          });
        });
      });

      describe("WHEN query end with a dot", () => {
        describe("WHEN query is `with-ch1.`", () => {
          test("THEN find partial match with in hierarchy and show its children", async () => {
            await runLookupTest("with-ch1.", (out) => {
              expectQuickPick(out?.quickpick).toIncludeFname(
                "goo.ends-with-ch1.no-ch1-by-itself"
              );
              expectQuickPick(out?.quickpick).toNotIncludeFname("foo.ch1.gch1");
            });
          });
        });
        describe("WHEN query is `ch1.gch1.`", () => {
          test("THEN finds direct match within hierarchy.", async () => {
            await runLookupTest("ch1.gch1.", (out) => {
              // Showing direct children of matches in different hierarchies:
              expectQuickPick(out?.quickpick).toIncludeFname(
                "bar.ch1.gch1.ggch1"
              );
              expectQuickPick(out?.quickpick).toIncludeFname(
                "foo.ch1.gch1.ggch1"
              );
              // Not showing our own match
              expectQuickPick(out?.quickpick).toNotIncludeFname("bar.ch1.gch1");
            });
          });
        });
      });
      describe("extended search:", () => {
        test("WHEN running querying with exclusion THEN exclude unwanted but keep others", async () => {
          await runLookupTest("!bar ch1", (out) => {
            expectQuickPick(out?.quickpick).toIncludeFname("foo.ch1");
            expectQuickPick(out?.quickpick).toNotIncludeFname("bar.ch1");
          });
        });
        test("WHEN running `ends with query` THEN filter to values that end with desired query.", async () => {
          await runLookupTest("foo$", (out) => {
            expectQuickPick(out?.quickpick).toIncludeFname("foo");
            expectQuickPick(out?.quickpick).toNotIncludeFname("foo.ch1");
          });
        });
        test("WHEN running query with (|) THEN match both values", async () => {
          await runLookupTest("foo | bar", (out) => {
            expectQuickPick(out?.quickpick).toIncludeFname("foo.ch1");
            expectQuickPick(out?.quickpick).toIncludeFname("bar.ch1");
          });
        });
      });
      describe("WHEN user looks up a note without using a space where the query doesn't match the note's case", () => {
        test("THEN lookup result must cantain all matching values irrespective of case", async () => {
          await runLookupTest("bar.CH1", (out) => {
            expectQuickPick(out?.quickpick).toIncludeFname("bar.ch1");
          });
        });
      });
    }
  );

  describe("onAccept", () => {
    describeMultiWS(
      "WHEN new NODE",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      },
      () => {
        test("THEN create new item has name of quickpick value", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foobar",
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(2);
          const createNewItem = _.first(opts.quickpick.selectedItems);
          const createNewWithTemplateItem = _.last(
            opts.quickpick.selectedItems
          );
          expect(_.pick(createNewItem, ["id", "fname"])).toEqual({
            id: "Create New",
            fname: "foobar",
          });
          expect(_.pick(createNewWithTemplateItem, ["id", "fname"])).toEqual({
            id: "Create New with Template",
            fname: "foobar",
          });
          expect(
            (
              await WSUtils.getNoteFromDocument(
                VSCodeUtils.getActiveTextEditorOrThrow().document
              )
            )?.fname
          ).toEqual("foobar");
        });

        test("AND create new with template", async () => {
          const extension = ExtensionProvider.getExtension();
          const ws = extension.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const mockQuickPick = createMockQuickPick({
            value: "foobarbaz",
            selectedItems: [
              NotePickerUtils.createNewWithTemplateItem({
                fname: "foobarbaz",
              }),
            ],
          });
          const lc = await extension.lookupControllerFactory.create({
            nodeType: "note",
          });
          const lp = extension.noteLookupProviderFactory.create("lookup", {
            allowNewNote: true,
            allowNewNoteWithTemplate: true,
            noHidePickerOnAccept: false,
          });
          await lc.prepareQuickPick({
            initialValue: "foobarbaz",
            provider: lp,
            placeholder: "",
          });
          cmd.controller = lc;
          cmd.provider = lp;

          const fooNote = (await engine.getNote("foo")).data;
          const getTemplateStub = sinon
            .stub(cmd, "getTemplateForNewNote" as keyof NoteLookupCommand)
            .returns(Promise.resolve(fooNote));
          mockQuickPick.showNote = async (uri) => {
            return vscode.window.showTextDocument(uri);
          };

          await cmd.execute({
            quickpick: mockQuickPick,
            controller: lc,
            provider: lp,
            selectedItems: mockQuickPick.selectedItems,
          });
          const document = VSCodeUtils.getActiveTextEditorOrThrow().document;
          const newNote = await extension.wsUtils.getNoteFromDocument(document);
          expect(newNote?.fname).toEqual("foobarbaz");
          expect(newNote?.body).toEqual(fooNote?.body);
          cmd.cleanUp();
          getTemplateStub.restore();
        });

        test("AND create new with template, but cancelled or nothing selected", async () => {
          const extension = ExtensionProvider.getExtension();
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const mockQuickPick = createMockQuickPick({
            value: "capers-are-not-berries",
            selectedItems: [
              NotePickerUtils.createNewWithTemplateItem({
                fname: "capers-are-not-berries",
              }),
            ],
          });
          const lc = await extension.lookupControllerFactory.create({
            nodeType: "note",
          });
          const lp = extension.noteLookupProviderFactory.create("lookup", {
            allowNewNote: true,
            allowNewNoteWithTemplate: true,
            noHidePickerOnAccept: false,
          });
          await lc.prepareQuickPick({
            initialValue: "capers-are-not-berries",
            provider: lp,
            placeholder: "",
          });
          cmd.controller = lc;
          cmd.provider = lp;

          const getTemplateStub = sinon
            .stub(cmd, "getTemplateForNewNote" as keyof NoteLookupCommand)
            .returns(Promise.resolve(undefined));
          mockQuickPick.showNote = async (uri) => {
            return vscode.window.showTextDocument(uri);
          };

          const cmdSpy = sinon.spy(cmd, "acceptNewWithTemplateItem");
          await cmd.execute({
            quickpick: mockQuickPick,
            controller: lc,
            provider: lp,
            selectedItems: mockQuickPick.selectedItems,
          });
          const acceptNewWithTemplateItemOut = await cmdSpy.returnValues[0];

          // accept result is undefined
          expect(acceptNewWithTemplateItemOut).toEqual(undefined);

          // foobarbaz is not created if template selection is cancelled, or selection was empty.
          const maybeFooBarBazNotes = await engine.findNotes({
            fname: "capers-are-not-berries",
          });
          expect(maybeFooBarBazNotes.length).toEqual(0);
          cmdSpy.restore();
          cmd.cleanUp();
          getTemplateStub.restore();
        });
      }
    );

    describeMultiWS(
      "WHEN a new note with .md in its name is created",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      },
      () => {
        test("THEN its title generation should not break", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "learn.mdone.test",
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(2);
          const createNewItem = _.first(opts.quickpick.selectedItems);
          const createNewWithTemplateItem = _.last(
            opts.quickpick.selectedItems
          );
          expect(_.pick(createNewItem, ["id", "fname"])).toEqual({
            id: "Create New",
            fname: "learn.mdone.test",
          });
          expect(_.pick(createNewWithTemplateItem, ["id", "fname"])).toEqual({
            id: "Create New with Template",
            fname: "learn.mdone.test",
          });
          const note = await ExtensionProvider.getWSUtils().getNoteFromDocument(
            VSCodeUtils.getActiveTextEditorOrThrow().document
          );
          expect(note?.fname).toEqual("learn.mdone.test");
          expect(note?.title).toEqual("Test");
        });
      }
    );

    describeMultiWS(
      "WHEN user lookup a note where the query doesn't match the note's case in multi-vault setup ",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      },
      () => {
        test("THEN result must include note irresepective of casing", async () => {
          const cmd = new NoteLookupCommand();
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "FOOCH1",
          }))!;
          expectQuickPick(opts.quickpick).toIncludeFname("foo.ch1");
        });
      }
    );

    describeMultiWS(
      "WHEN new node is stub",
      {
        ctx,
        preSetupHook: async ({ vaults, wsRoot }) => {
          const vault = TestEngineUtils.vault1(vaults);
          await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
            vault,
            wsRoot,
          });
        },
      },
      () => {
        test("THEN a note is created and stub property is removed", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;
          const cmd = new NoteLookupCommand();
          const vault = TestEngineUtils.vault1(vaults);
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "foo",
          }))!;
          expect(_.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
          const fooNote = (
            await engine.findNotesMeta({
              fname: "foo",
              vault,
            })
          )[0];
          expect(fooNote.stub).toBeFalsy();
        });
      }
    );

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
          const barFromEngine = (await engine.getNote("bar")).data!;
          const editor = VSCodeUtils.getActiveTextEditor()!;
          const activeNote = await WSUtils.getNoteFromDocument(editor.document);
          expect(activeNote).toEqual(barFromEngine);
          const parent = (await engine.getNote(barFromEngine.parent!)).data!;
          expect(DNodeUtils.isRoot(parent));
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
          sinon
            .stub(PickerUtilsV2, "getVaultForOpenEditor")
            .returns(Promise.resolve(vault!));

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
          // TODO: rewrite this whole test with `describMultiWS` once we remove `DConfig`.
          withConfig(
            (config) => {
              ConfigUtils.setNoteLookupProps(
                config,
                "confirmVaultOnCreate",
                true
              );
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
          // One item for our file name and one each for `Create New`, `Create New with Template`
          // are multiple vaults in this test.
          expect(quickpick.selectedItems.length).toEqual(3);
          expect(_.pick(quickpick.selectedItems[0], ["id", "vault"])).toEqual({
            id: fname,
            vault,
          });
          done();
        },
      });
    });

    describeMultiWS(
      "WHEN user creates new note with enableFullHierarchyNoteTitle == true",
      {
        modConfigCb: (config) => {
          ConfigUtils.setWorkspaceProp(
            config,
            "enableFullHierarchyNoteTitle",
            true
          );
          return config;
        },
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      },

      () => {
        test("THEN the new note title should reflect the full hierarchy name", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            noConfirm: true,
            initialValue: "one.two.three",
          });

          const editor = VSCodeUtils.getActiveTextEditor()!;
          const activeNote = await WSUtilsV2.instance().getNoteFromDocument(
            editor.document
          );

          expect(activeNote?.title).toEqual("One Two Three");
        });
      }
    );

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
          const newNote = await WSUtils.getNoteFromDocument(document!);
          expect(_.trim(newNote!.body)).toEqual("ch1 template");
          expect(newNote?.tags).toEqual("tag-foo");

          done();
        },
      });
    });

    describeMultiWS(
      "WHEN schema template references to a template note that lies in a different vault",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault2
          await NoteTestUtilsV4.createNote({
            wsRoot,
            body: "food ch2 template",
            fname: "template.ch2",
            vault: vaults[1],
          });
          const template: SchemaTemplate = {
            id: "template.ch2",
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("THEN template body gets applied to new note FROM other vault", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;

          const newNote = (
            await engine.findNotes({ fname: "food.ch2", vault: vaults[0] })
          )[0];
          expect(_.trim(newNote?.body)).toEqual("food ch2 template");

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note that lies in a different vault using xvault notation",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1 and specifies template in vaultThree
          const vault = vaults[0];
          // Template is in vault2 and vaultThree
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vault 2",
            fname: "template.ch2",
            vault: vaults[1],
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vaultThree",
            fname: "template.ch2",
            vault: vaults[2],
          });
          const template: SchemaTemplate = {
            id: `dendron://${VaultUtils.getName(vaults[2])}/template.ch2`,
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("THEN correct template body FROM vault referred to be xvault link gets applied to new note", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;

          const newNote = (
            await engine.findNotes({ fname: "food.ch2", vault: vaults[0] })
          )[0];
          expect(_.trim(newNote?.body)).toEqual(
            "food ch2 template in vaultThree"
          );

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note and there exists a stub with the same name",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault1
          await NoteTestUtilsV4.createNote({
            wsRoot,
            body: "food ch2 template",
            fname: "template.ch2",
            vault,
          });
          // template.ch2 is now a stub in vault2
          await NoteTestUtilsV4.createNote({
            wsRoot,
            body: "food ch2 child note",
            fname: "template.ch2.child",
            vault: vaults[1],
          });
          const template: SchemaTemplate = {
            id: "template.ch2",
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        let showQuickPick: sinon.SinonStub;

        beforeEach(() => {
          showQuickPick = sinon.stub(vscode.window, "showQuickPick");
        });
        afterEach(() => {
          showQuickPick.restore();
        });

        test("THEN user does not get prompted with stub suggesstion and template note body gets applied to new note", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;

          const newNote = (
            await engine.findNotes({ fname: "food.ch2", vault: vaults[0] })
          )[0];
          expect(showQuickPick.calledOnce).toBeFalsy();
          expect(_.trim(newNote?.body)).toEqual("food ch2 template");
          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note that lies in multiple vaults without cross vault notation",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault2 and vaultThree
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vault 2",
            fname: "template.ch2",
            vault: vaults[1],
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vaultThree",
            fname: "template.ch2",
            vault: vaults[2],
          });
          const template: SchemaTemplate = {
            id: "template.ch2",
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        let showQuickPick: sinon.SinonStub;

        beforeEach(() => {
          showQuickPick = sinon.stub(vscode.window, "showQuickPick");
        });
        afterEach(() => {
          showQuickPick.restore();
        });

        test("AND user picks from prompted vault, THEN template body gets applied to new note", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;

          // Pick vault 2
          showQuickPick.onFirstCall().returns(
            Promise.resolve({
              label: "vault2",
              vault: vaults[1],
            }) as Thenable<vscode.QuickPickItem>
          );
          const cmd = new NoteLookupCommand();
          await cmd
            .run({
              initialValue: "food.ch2",
              noConfirm: true,
            })
            .then(async () => {
              const newNote = (
                await engine.findNotes({ fname: "food.ch2", vault: vaults[0] })
              )[0];
              expect(showQuickPick.calledOnce).toBeTruthy();
              expect(_.trim(newNote?.body)).toEqual(
                "food ch2 template in vault 2"
              );
            });

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note that lies in multiple vaults without cross vault notation",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault2 and vaultThree
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vault 2",
            fname: "template.ch2",
            vault: vaults[1],
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            genRandomId: true,
            body: "food ch2 template in vaultThree",
            fname: "template.ch2",
            vault: vaults[2],
          });
          const template: SchemaTemplate = {
            id: "template.ch2",
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        let showQuickPick: sinon.SinonStub;

        beforeEach(() => {
          showQuickPick = sinon.stub(vscode.window, "showQuickPick");
        });
        afterEach(() => {
          showQuickPick.restore();
        });

        test("AND user escapes from prompted vault, THEN no template gets applied to new note", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;

          // Escape out, leading to undefined note
          showQuickPick.onFirstCall().returns(Promise.resolve(undefined));
          const cmd = new NoteLookupCommand();
          await cmd
            .run({
              initialValue: "food.ch2",
              noConfirm: true,
            })
            .then(async () => {
              const newNote = (
                await engine.findNotes({ fname: "food.ch2", vault: vaults[0] })
              )[0];
              expect(showQuickPick.calledOnce).toBeTruthy();
              expect(_.trim(newNote?.body)).toEqual("");
            });

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note that lies in a different vault using xvault notation that points to the wrong vault",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault2
          await NoteTestUtilsV4.createNote({
            wsRoot,
            body: "food ch2 template",
            fname: "template.ch2",
            vault: vaults[1],
          });
          const template: SchemaTemplate = {
            id: `dendron://missingVault/template.ch2`,
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("THEN warning message gets shown about missing vault", async () => {
          const windowSpy = sinon.spy(vscode.window, "showWarningMessage");
          const cmd = new NoteLookupCommand();

          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const warningMsg = windowSpy.getCall(0).args[0];
          expect(warningMsg).toEqual(
            `Warning: Problem with food.ch2 schema. No vault found for missingVault`
          );

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a template note that lies in a different vault using incorrect xvault notation",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        postSetupHook: async ({ wsRoot, vaults }) => {
          // Schema is in vault1
          const vault = vaults[0];
          // Template is in vault2
          await NoteTestUtilsV4.createNote({
            wsRoot,
            body: "food ch2 template",
            fname: "template.ch2",
            vault: vaults[1],
          });
          const template: SchemaTemplate = {
            id: `blah://${VaultUtils.getName(vaults[1])}/template.ch2`,
            type: "note",
          };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("THEN warning message gets shown about missing template", async () => {
          const windowSpy = sinon.spy(vscode.window, "showWarningMessage");
          const cmd = new NoteLookupCommand();

          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const warningMsg = windowSpy.getCall(0).args[0];
          expect(warningMsg).toEqual(
            `Warning: Problem with food.ch2 schema. No note found`
          );

          cmd.cleanUp();
        });
      }
    );

    describeMultiWS(
      "WHEN schema template references to a missing template note",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        postSetupHook: async ({ wsRoot, vaults }) => {
          const vault = vaults[0];
          const template: SchemaTemplate = { id: "food.missing", type: "note" };
          await NoteTestUtilsV4.setupSchemaCrossVault({
            wsRoot,
            vault,
            template,
          });
        },
      },
      () => {
        test("THEN warning message gets shown about missing note", async () => {
          const windowSpy = sinon.spy(vscode.window, "showWarningMessage");
          const cmd = new NoteLookupCommand();

          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const warningMsg = windowSpy.getCall(0).args[0];
          expect(warningMsg).toEqual(
            "Warning: Problem with food.ch2 schema. No note found"
          );

          cmd.cleanUp();
        });
      }
    );

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
          const newNote = await WSUtils.getNoteFromDocument(document!);
          expect(newNote?.fname).toEqual("foo.ch1");

          cmd.cleanUp();
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
          const newNote = await WSUtils.getNoteFromDocument(document!);
          expect(_.trim(newNote!.body)).toEqual("Template text");

          cmd.cleanUp();
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
          await provider.onDidAccept({
            quickpick,
            cancellationToken: controller.cancelToken,
          })();
          expect(spyFetchPickerResultsNoInput.calledOnce).toBeTruthy();
          cmd.cleanUp();
          done();
        },
      });
    });
  });

  describe("onAccept with lookupConfirmVaultOnCreate", () => {
    const modConfigCb = (config: DendronConfig) => {
      ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
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
          cmd.cleanUp();
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

          cmd.cleanUp();
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

          cmd.cleanUp();
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

          cmd.cleanUp();
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
        onInit: async ({ vaults, engine, wsRoot }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          // with journal note modifier enabled,
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          })) as CommandOutput;

          const dateFormat = (
            await ConfigService.instance().getConfig(
              URI.file(wsRoot),
              "workspace.journal.dateFormat"
            )
          )._unsafeUnwrap();
          expect(dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(dateFormat);
          const noteName = `foo.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = await WSUtils.getNoteFromDocument(
            VSCodeUtils.getActiveTextEditor()!.document
          );

          expect(note?.fname).toEqual(noteName);

          const titleOverride = today.split(".").join("-");
          expect(note!.title).toEqual(titleOverride);

          cmd.cleanUp();
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
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
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

          cmd.cleanUp();
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
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);

          const createScratch = async () => {
            const out = (await cmd.run({
              noteType: LookupNoteTypeEnum.scratch,
              noConfirm: true,
            })) as CommandOutput;

            return out.quickpick.value;
          };

          const scratch1Name = await createScratch();
          await waitInMilliseconds(1000);
          const scratch2Name = await createScratch();

          expect(scratch1Name).toNotEqual(scratch2Name);

          cmd.cleanUp();
          done();
        },
      });
    });

    test("task note basic", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          // with scratch note modifier enabled,
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.task,
            noConfirm: true,
          })) as CommandOutput;

          expect(out.quickpick.value.startsWith(`task`)).toBeTruthy();

          cmd.cleanUp();
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
        onInit: async ({ vaults, engine, wsRoot }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          // with journal note modifier enabled,
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.journal,
            initialValue: "gamma",
            noConfirm: true,
          })) as CommandOutput;

          const dateFormat = (
            await ConfigService.instance().getConfig(
              URI.file(wsRoot),
              "workspace.journal.dateFormat"
            )
          )._unsafeUnwrap();
          expect(dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(dateFormat);
          const noteName = `gamma.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = await WSUtils.getNoteFromDocument(
            VSCodeUtils.getActiveTextEditor()!.document
          );
          const titleOverride = today.split(".").join("-");
          expect(note!.title).toEqual(titleOverride);

          cmd.cleanUp();
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
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.journal,
          });

          const { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickPick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(controller.quickPick.value.startsWith("foo.journal."));

          cmd.cleanUp();
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
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.scratch,
          });

          const { journalBtn, scratchBtn } = getNoteTypeButtons(
            controller.quickPick.buttons
          );

          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeTruthy();
          expect(controller.quickPick.value.startsWith("scratch."));

          cmd.cleanUp();
          done();
        },
      });
    });

    test("task modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.task,
          });

          const { journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickPick.buttons
          );

          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeTruthy();
          expect(controller.quickPick.value.startsWith("task."));

          cmd.cleanUp();
          done();
        },
      });
    });

    test("selection modifier set to none in configs", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config: DendronConfig) => {
          ConfigUtils.setNoteLookupProps(
            config,
            "selectionMode",
            LookupSelectionModeEnum.none
          );
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
          cmd.cleanUp();
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
          cmd.cleanUp();
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
          cmd.cleanUp();
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
          const fooNoteEditor = await WSUtils.openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

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
          const newNote = await WSUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body).toEqual("");

          // should change selection to link with alais.
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.endsWith("[[foo body|foo.foo-body]]\n"));

          // Note should have its links updated, since selection2link put a link in it

          // TODO: Re-enable checks below. There's currently a race condition
          // with the check, where it needs to wait for NoteSyncService to
          // finish its callback before we should check the engine state. The
          // test should subscribe to OnNoteChange event and do the check upon
          // event firing. However, NoteSyncService is currently not exposed in
          // the test infrastructure.

          // const oldNote = (await engine.getNoteMeta("foo")).data!;
          // expect(oldNote.links.length).toEqual(1);
          // expect(oldNote.links[0].value).toEqual("foo.foo-body");
          cmd.cleanUp();
          done();
        },
      });
    });

    describeSingleWS(
      "WHEN selection2link is used with a multi-line string",
      {
        ctx,
        postSetupHook: async ({ vaults, wsRoot }) => {
          NoteTestUtilsV4.createNote({
            fname: "multi-line",
            vault: vaults[0],
            wsRoot,
            body: "test\ning\n",
          });
        },
      },
      () => {
        test("THEN it produces a valid string", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { engine } = ws;
          const vaults = await ws.vaults;
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await ExtensionProvider.getWSUtils().openNote(
            (
              await engine.getNoteMeta("multi-line")
            ).data!
          );

          // selects "test \n ing \n"
          fooNoteEditor.selection = new vscode.Selection(7, 0, 9, 0);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("test\ning\n");

          await cmd.run({
            selectionType: "selection2link",
            noConfirm: true,
          });

          // should create foo.foo-body.md with an empty body.
          expect(getActiveEditorBasename().endsWith("multi-line.testing.md"));
          const newNoteEditor = VSCodeUtils.getActiveTextEditorOrThrow();
          const newNote =
            await ExtensionProvider.getWSUtils().getNoteFromDocument(
              newNoteEditor.document
            );
          expect(newNote?.body).toEqual("");

          // should change selection to link with alais.
          const changedText = fooNoteEditor.document.getText();
          expect(changedText.endsWith("[[testing|multi-line.testing]]\n"));

          cmd.cleanUp();
        });
      }
    );

    test("selection2link modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await WSUtils.openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          const { controller } = await cmd.gatherInputs({
            selectionType: "selection2link",
          });

          const { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(controller.quickPick.buttons);

          expect(selection2linkBtn?.pressed).toBeTruthy();
          expect(selectionExtractBtn.pressed).toBeFalsy();
          expect(controller.quickPick.value).toEqual("foo.foo-body");

          cmd.cleanUp();
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
          const fooNoteEditor = await WSUtils.openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );
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
          const newNote = await WSUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body.trim()).toEqual("foo body");

          // should remove selection
          const originalNote = (
            await engine.findNotes({
              fname: "foo",
              vault: vaults[0],
            })
          )[0];
          expect(originalNote.body.includes("foo body")).toBeFalsy();
          cmd.cleanUp();
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
          // TODO: rewrite this whole test with `describMultiWS` once we remove `DConfig`.
          withConfig(
            (config) => {
              ConfigUtils.setNoteLookupProps(config, "leaveTrace", true);
              return config;
            },
            { wsRoot }
          );
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await WSUtils.openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );
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
          const newNote = await WSUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body.trim()).toEqual("foo body");
          // should remove selection
          const changedText = fooNoteEditor.document.getText();
          expect(
            changedText.includes(`![[${newNote?.title}|${newNote?.fname}]]`)
          ).toBeTruthy();
          expect(changedText.includes("foo body")).toBeFalsy();
          cmd.cleanUp();
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
          const newNote = await WSUtils.getNoteFromDocument(
            newNoteEditor.document
          );
          expect(newNote?.body.trim()).toEqual("non vault content");

          const nonVaultFileEditor = (await VSCodeUtils.openFileInEditor(
            uri
          )) as vscode.TextEditor;
          expect(nonVaultFileEditor.document.getText()).toEqual(extBody);
          cmd.cleanUp();
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
          const fooNoteEditor = await WSUtils.openNote(
            (
              await engine.getNoteMeta("foo")
            ).data!
          );

          fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
          const { text } = VSCodeUtils.getSelection();
          expect(text).toEqual("foo body");

          const { controller } = await cmd.gatherInputs({
            selectionType: "selectionExtract",
          });

          const { selection2linkBtn, selectionExtractBtn } =
            getSelectionTypeButtons(controller.quickPick.buttons);

          expect(selection2linkBtn?.pressed).toBeFalsy();
          expect(selectionExtractBtn.pressed).toBeTruthy();

          cmd.cleanUp();
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

          await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
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

          cmd.cleanUp();
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

          const { horizontalSplitBtn } = getSplitTypeButtons(
            controller.quickPick.buttons
          );

          expect(horizontalSplitBtn?.pressed).toBeTruthy();

          cmd.cleanUp();
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

          cmd.cleanUp();
          done();
        },
      });
    });
  });

  describe("journal + selection2link interactions", () => {
    const prepareCommandFunc = async ({ vaults, engine }: any) => {
      const cmd = new NoteLookupCommand();
      stubVaultPick(vaults);

      const fooNoteEditor = await WSUtils.openNote(
        (
          await engine.getNoteMeta("foo")
        ).data!
      );
      // selects "foo body"
      fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
      const { text } = VSCodeUtils.getSelection();
      expect(text).toEqual("foo body");

      const { controller } = await cmd.gatherInputs({
        noteType: LookupNoteTypeEnum.journal,
        selectionType: LookupSelectionTypeEnum.selection2link,
      });
      return { controller, cmd };
    };

    test("journal and selection2link both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine, wsRoot }) => {
          const { controller, cmd } = await prepareCommandFunc({
            vaults,
            engine,
          });

          const { journalBtn } = getNoteTypeButtons(
            controller.quickPick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickPick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          const dateFormat = (
            await ConfigService.instance().getConfig(
              URI.file(wsRoot),
              "workspace.journal.dateFormat"
            )
          )._unsafeUnwrap();
          const today = Time.now().toFormat(dateFormat);
          expect(controller.quickPick.value).toEqual(
            `foo.journal.${today}.foo-body`
          );

          cmd.cleanUp();
          done();
        },
      });
    });

    describe("scratch + selection2link interactions", () => {
      const prepareCommandFunc = async ({ vaults, engine }: any) => {
        const cmd = new NoteLookupCommand();
        stubVaultPick(vaults);

        const fooNoteEditor = await WSUtils.openNote(
          (
            await engine.getNoteMeta("foo")
          ).data!
        );
        // selects "foo body"
        fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
        const { text } = VSCodeUtils.getSelection();
        expect(text).toEqual("foo body");

        const { controller } = await cmd.gatherInputs({
          noteType: LookupNoteTypeEnum.scratch,
          selectionType: LookupSelectionTypeEnum.selection2link,
        });
        return { controller, cmd };
      };

      test("scratch and selection2link both applied", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          },
          onInit: async ({ vaults, engine }) => {
            const { controller, cmd } = await prepareCommandFunc({
              vaults,
              engine,
            });

            const { scratchBtn } = getNoteTypeButtons(
              controller.quickPick.buttons
            );

            const { selection2linkBtn } = getSelectionTypeButtons(
              controller.quickPick.buttons
            );

            expect(scratchBtn.pressed).toBeTruthy();
            expect(selection2linkBtn.pressed).toBeTruthy();

            const todayFormatted = getTodayInScratchDateFormat();
            const quickpickValue = controller.quickPick.value;
            expect(
              quickpickValue.startsWith(`scratch.${todayFormatted}`)
            ).toBeTruthy();
            expect(quickpickValue.endsWith(".foo-body")).toBeTruthy();

            cmd.cleanUp();
            done();
          },
        });
      });
    });

    describe("task + selection2link interactions", () => {
      const prepareCommandFunc = async ({ vaults, engine }: any) => {
        const cmd = new NoteLookupCommand();
        stubVaultPick(vaults);

        const fooNoteEditor = await WSUtils.openNote(
          (
            await engine.getNoteMeta("foo")
          ).data!
        );
        // selects "foo body"
        fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
        const { text } = VSCodeUtils.getSelection();
        expect(text).toEqual("foo body");

        const { controller } = await cmd.gatherInputs({
          noteType: LookupNoteTypeEnum.task,
          selectionType: LookupSelectionTypeEnum.selection2link,
        });
        return { controller, cmd };
      };

      test("task and selection2link both applied", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          },
          onInit: async ({ vaults, engine }) => {
            const { controller } = await prepareCommandFunc({
              vaults,
              engine,
            });

            const { taskBtn } = getNoteTypeButtons(
              controller.quickPick.buttons
            );

            const { selection2linkBtn } = getSelectionTypeButtons(
              controller.quickPick.buttons
            );

            expect(taskBtn.pressed).toBeTruthy();
            expect(selection2linkBtn.pressed).toBeTruthy();

            const quickpickValue = controller.quickPick.value;
            expect(quickpickValue.startsWith(`task.`)).toBeTruthy();
            expect(quickpickValue.endsWith(".foo-body")).toBeTruthy();

            controller.onHide();
            done();
          },
        });
      });
    });

    describe("note modifiers + selectionExtract interactions", () => {
      const prepareCommandFunc = async ({ vaults, engine, noteType }: any) => {
        const cmd = new NoteLookupCommand();
        stubVaultPick(vaults);

        const fooNoteEditor = await WSUtils.openNote(
          (
            await engine.getNoteMeta("foo")
          ).data!
        );
        // selects "foo body"
        fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
        const { text } = VSCodeUtils.getSelection();
        expect(text).toEqual("foo body");

        const cmdOut = await cmd.run({
          noteType,
          selectionType: LookupSelectionTypeEnum.selectionExtract,
          noConfirm: true,
        });
        return { cmdOut, selectedText: text, cmd };
      };

      test("journal + selectionExtract both applied", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          },
          onInit: async ({ vaults, engine, wsRoot }) => {
            const { selectedText, cmd } = await prepareCommandFunc({
              vaults,
              engine,
              noteType: LookupNoteTypeEnum.journal,
            });

            const dateFormat = (
              await ConfigService.instance().getConfig(
                URI.file(wsRoot),
                "workspace.journal.dateFormat"
              )
            )._unsafeUnwrap();
            const today = Time.now().toFormat(dateFormat);
            const newNote = (
              await engine.findNotes({
                fname: `foo.journal.${today}`,
                vault: vaults[0],
              })
            )[0];

            expect(newNote.body.trim()).toEqual(selectedText);

            cmd.cleanUp();
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
          onInit: async ({ vaults, engine }) => {
            const { cmdOut, selectedText, cmd } = await prepareCommandFunc({
              vaults,
              engine,
              noteType: LookupNoteTypeEnum.scratch,
            });

            const newNote = (
              await engine.findNotes({
                fname: cmdOut!.quickpick.value,
                vault: vaults[0],
              })
            )[0];
            expect(newNote.body.trim()).toEqual(selectedText);

            cmd.cleanUp();
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
        const notesToSelect: NoteProps[] = (
          await engine.bulkGetNotes(["foo.ch1", "bar", "lorem", "ipsum"])
        ).data;
        const selectedItems = (await Promise.all(
          notesToSelect.map(async (note) => {
            return DNodeUtils.enhancePropForQuickInputV3({
              props: note,
              schema: note.schema
                ? (await engine.getSchema(note.schema.moduleId)).data
                : undefined,
              wsRoot,
              vaults,
            });
          })
        )) as NoteQuickInputV2[];

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

            await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
            const { cmd } = await prepareCommandFunc({
              wsRoot,
              vaults,
              engine,
              opts: { split: true },
            });

            await cmd.run({
              multiSelect: true,
              splitType: LookupSplitTypeEnum.horizontal,
              noConfirm: true,
            });
            const editor = VSCodeUtils.getActiveTextEditor();
            // one open, lookup with 2 selected. total 3 columns.
            expect(editor?.viewColumn).toEqual(5);
            sinon.restore();

            cmd.cleanUp();
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

            await WSUtils.openNote((await engine.getNoteMeta("foo")).data!);
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

            cmd.cleanUp();
            done();
          },
        });
      });
    });
  });

  describe("GIVEN a stub note that should match some schema", () => {
    describeMultiWS(
      "WHEN it is accepted as a new item",
      {
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createSchema({
            fname: "test",
            wsRoot,
            vault: vaults[0],
            modifier: (schema) => {
              const schemas = [
                SchemaUtils.createFromSchemaOpts({
                  fname: "test",
                  id: "test",
                  children: ["testing"],
                  title: "test",
                  parent: "root",
                  vault: vaults[0],
                }),
                SchemaUtils.createFromSchemaRaw({
                  id: "testing",
                  pattern: "*",
                  title: "testing",
                  namespace: true,
                  template: {
                    id: "template.test",
                    type: "note",
                  },
                  vault: vaults[0],
                }),
              ];
              schemas.map((s) => {
                schema.schemas[s.id] = s;
              });
              return schema;
            },
          });
          await NoteTestUtilsV4.createNote({
            fname: "template.test",
            wsRoot,
            vault: vaults[0],
            body: "template body",
          });
          await NoteTestUtilsV4.createNote({
            fname: "test.one.two.three",
            wsRoot,
            vault: vaults[0],
          });
        },
      },
      () => {
        test("stub note that was accepted is created with the schema applied", async () => {
          VSCodeUtils.closeAllEditors();
          const cmd = new NoteLookupCommand();
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          stubVaultPick(vaults);
          const engine = ExtensionProvider.getEngine();
          await cmd.run({
            noConfirm: true,
            initialValue: "test.one.two",
          });
          const findResp = await engine.findNotes({
            fname: "test.one.two",
          });
          expect(findResp.length).toEqual(1);
          const createdNote = findResp[0];

          // created note has schema applied
          expect(createdNote.schema).toBeTruthy();

          // created note has template that was specified by the schema applied
          const templateNote = (await engine.getNote("template.test")).data;
          expect(createdNote.body).toEqual(templateNote?.body);
        });
      }
    );
  });
});

suite("stateService", function () {
  let homeDirStub: SinonStub;
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
    noSetInstallStatus: true,
  });
  describe("GIVEN user accepts lookup for the first time", () => {
    test("THEN global states firstLookupTime and lastLookupTime are set correctly", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults }) => {
          VSCodeUtils.closeAllEditors();

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          let metaData = MetadataService.instance().getMeta();
          expect(_.isUndefined(metaData.firstLookupTime)).toBeTruthy();
          expect(_.isUndefined(metaData.lastLookupTime)).toBeTruthy();
          await cmd.run({
            noConfirm: true,
          });
          metaData = MetadataService.instance().getMeta();
          expect(_.isUndefined(metaData.firstLookupTime)).toBeFalsy();
          expect(_.isUndefined(metaData.lastLookupTime)).toBeFalsy();

          cmd.cleanUp();
          done();
        },
      });
    });
  });

  describe("GIVEN user accepts subsequent lookup", () => {
    test("THEN global state lastLookupTime is set correctly", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults }) => {
          VSCodeUtils.closeAllEditors();

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          await cmd.run({
            noConfirm: true,
          });
          let metaData = MetadataService.instance().getMeta();
          const firstLookupTime = metaData.firstLookupTime;
          const lastLookupTime = metaData.lastLookupTime;
          expect(_.isUndefined(firstLookupTime)).toBeFalsy();
          expect(_.isUndefined(lastLookupTime)).toBeFalsy();

          await cmd.run({
            noConfirm: true,
          });

          metaData = MetadataService.instance().getMeta();
          expect(metaData.firstLookupTime).toEqual(firstLookupTime);
          expect(metaData.lastLookupTime).toNotEqual(lastLookupTime);

          cmd.cleanUp();
          done();
        },
      });
    });
  });
});
