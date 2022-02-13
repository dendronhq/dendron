import {
  ConfigUtils,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  IntermediateDendronConfig,
  LookupSelectionModeEnum,
  NoteQuickInput,
  NoteUtils,
  SchemaUtils,
  SchemaTemplate,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  EngineTestUtilsV4,
  FileTestUtils,
  NOTE_PRESETS_V4,
  NoteTestUtilsV4,
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
import { afterEach, beforeEach, describe, Done } from "mocha";
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
import { DendronBtn } from "../../components/lookup/ButtonTypes";
import { CREATE_NEW_LABEL } from "../../components/lookup/constants";
import {
  DendronQuickPickerV2,
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
  LookupSplitTypeEnum,
} from "../../components/lookup/types";
import {
  createNoActiveItem,
  PickerUtilsV2,
} from "../../components/lookup/utils";
import { NotePickerUtils } from "../../components/lookup/NotePickerUtils";
import { CONFIG } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StateService } from "../../services/stateService";
import { clipboard } from "../../utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { createMockQuickPick, getActiveEditorBasename } from "../testUtils";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: "vault1" });
  return sinon
    .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
    .returns(Promise.resolve(vault));
};

/**
 * Setup schema that references template that may or may not lie in same vault
 */
const setupSchemaCrossVault = (opts: {
  wsRoot: string;
  vault: DVault;
  template: SchemaTemplate;
}) => {
  const { wsRoot, vault, template } = opts;
  return NoteTestUtilsV4.createSchema({
    fname: "food",
    wsRoot,
    vault,
    modifier: (schema) => {
      const schemas = [
        SchemaUtils.createFromSchemaOpts({
          id: "food",
          parent: "root",
          fname: "food",
          children: ["ch2"],
          vault,
        }),
        SchemaUtils.createFromSchemaRaw({
          id: "ch2",
          template,
          namespace: true,
          vault,
        }),
      ];
      schemas.map((s) => {
        schema.schemas[s.id] = s;
      });
      return schema;
    },
  });
};

export function expectQuickPick(quickPick: DendronQuickPickerV2) {
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
          const actualNote = WSUtils.getNoteFromDocument(editor!.document);
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
          const actualNote = WSUtils.getNoteFromDocument(editor!.document);
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
          await WSUtils.openNote(engine.notes["foo"]);
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
  async function runLookupInHierarchyTestWorkspace(
    initialValue: string,
    assertions: (out: CommandOutput) => void,
    done: Done
  ) {
    await runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        await ENGINE_HOOKS.setupHierarchyForLookupTests({ wsRoot, vaults });
      },
      onInit: async () => {
        const cmd = new NoteLookupCommand();

        const out: CommandOutput = (await cmd.run({
          noConfirm: true,
          initialValue,
        }))!;

        assertions(out);

        done();
      },
    });
  }

  describe(`GIVEN default note look up settings:`, () => {
    test("WHEN running simplest query THEN find the matching value", (done) => {
      runLookupInHierarchyTestWorkspace(
        "ends-with-ch1",
        (out) => {
          expectQuickPick(out.quickpick).toIncludeFname(
            "goo.ends-with-ch1.no-ch1-by-itself"
          );
        },
        done
      );
    });

    describe(`Test: Queries ending with dot`, () => {
      test("WHEN querying with 'with-ch1.' THEN find partial match within hierarchy and show its children..", (done) => {
        runLookupInHierarchyTestWorkspace(
          "with-ch1.",
          (out) => {
            expectQuickPick(out.quickpick).toIncludeFname(
              "goo.ends-with-ch1.no-ch1-by-itself"
            );
            expectQuickPick(out.quickpick).toNotIncludeFname("foo.ch1.gch1");
          },
          done
        );
      });

      test("WHEN querying with 'ch1.gch1.' THEN finds direct match within hierarchy.", (done) => {
        runLookupInHierarchyTestWorkspace(
          "ch1.gch1.",
          (out) => {
            // Showing direct children of matches in different hierarchies:
            expectQuickPick(out.quickpick).toIncludeFname("bar.ch1.gch1.ggch1");
            expectQuickPick(out.quickpick).toIncludeFname("foo.ch1.gch1.ggch1");
            // Not showing our own match
            expectQuickPick(out.quickpick).toNotIncludeFname("bar.ch1.gch1");
          },
          done
        );
      });

      // Closest candidate is 'goo.ends-with-ch1.no-ch1-by-itself' which does contain 'ends-with-'
      // however since we add the dot to the query we expect at least the postfix of the part
      // of the hierarchy to match such as with 'with-ch1.' test. Here we deem it as not matching anything.
      test("WHEN querying with 'ends-with-.' THEN empty quick pick", (done) => {
        runLookupInHierarchyTestWorkspace(
          "ends-with-.",
          (out) => {
            expectQuickPick(out.quickpick).toBeEmpty();
          },
          done
        );
      });
    });

    describe(`Test extended search`, () => {
      test("WHEN running query with exclusion THEN exclude unwanted but keep others", (done) => {
        runLookupInHierarchyTestWorkspace(
          "!bar ch1",
          (out) => {
            expectQuickPick(out.quickpick).toIncludeFname("foo.ch1");
            expectQuickPick(out.quickpick).toNotIncludeFname("bar.ch1");
          },
          done
        );
      });

      test("WHEN running `ends with query` THEN filter to values that end with desired query.", (done) => {
        runLookupInHierarchyTestWorkspace(
          "foo$",
          (out) => {
            expectQuickPick(out.quickpick).toIncludeFname("foo");
            expectQuickPick(out.quickpick).toNotIncludeFname("foo.ch1");
          },
          done
        );
      });

      test("WHEN running query with (|) THEN match both values", (done) => {
        runLookupInHierarchyTestWorkspace(
          "foo | bar",
          (out) => {
            expectQuickPick(out.quickpick).toIncludeFname("foo.ch1");
            expectQuickPick(out.quickpick).toIncludeFname("bar.ch1");
          },
          done
        );
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
            WSUtils.getNoteFromDocument(
              VSCodeUtils.getActiveTextEditorOrThrow().document
            )?.fname
          ).toEqual("foobar");
          done();
        },
      });
    });

    describeMultiWS(
      "WHEN a new note with .md in its name is created",
      {
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
      },
      () => {
        test("THEN its title generation should not break", async () => {
          const { vaults } = ExtensionProvider.getDWorkspace();
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const opts = (await cmd.run({
            noConfirm: true,
            initialValue: "learn.mdone.test",
          }))!;
          expect(opts.quickpick.selectedItems.length).toEqual(1);
          const lastItem = _.last(opts.quickpick.selectedItems);
          expect(_.pick(lastItem, ["id", "fname"])).toEqual({
            id: "Create New",
            fname: "learn.mdone.test",
          });
          const note = ExtensionProvider.getWSUtils().getNoteFromDocument(
            VSCodeUtils.getActiveTextEditorOrThrow().document
          );
          expect(note?.fname).toEqual("learn.mdone.test");
          expect(note?.title).toEqual("Test");
        });
      }
    );

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
          const activeNote = WSUtils.getNoteFromDocument(editor.document);
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
          const newNote = WSUtils.getNoteFromDocument(document!);
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
        },
      },
      () => {
        test("THEN template body gets applied to new note FROM other vault", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const { engine, vaults } = ExtensionProvider.getDWorkspace();

          const newNote = NoteUtils.getNoteByFnameFromEngine({
            fname: "food.ch2",
            engine,
            vault: vaults[0],
          });
          expect(_.trim(newNote?.body)).toEqual("food ch2 template");
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
        },
      },
      () => {
        test("THEN correct template body FROM vault referred to be xvault link gets applied to new note", async () => {
          const cmd = new NoteLookupCommand();
          await cmd.run({
            initialValue: "food.ch2",
            noConfirm: true,
          });
          const { engine, vaults } = ExtensionProvider.getDWorkspace();

          const newNote = NoteUtils.getNoteByFnameFromEngine({
            fname: "food.ch2",
            engine,
            vault: vaults[0],
          });
          expect(_.trim(newNote?.body)).toEqual(
            "food ch2 template in vaultThree"
          );
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
          const { engine, vaults } = ExtensionProvider.getDWorkspace();

          const newNote = NoteUtils.getNoteByFnameFromEngine({
            fname: "food.ch2",
            engine,
            vault: vaults[0],
          });
          expect(showQuickPick.calledOnce).toBeFalsy();
          expect(_.trim(newNote?.body)).toEqual("food ch2 template");
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
          const { engine, vaults } = ExtensionProvider.getDWorkspace();

          // Pick vault 2
          showQuickPick.onFirstCall().returns(
            Promise.resolve({
              label: "vault2",
              vault: vaults[1],
            }) as Thenable<vscode.QuickPickItem>
          );
          const cmd = new NoteLookupCommand();
          cmd
            .run({
              initialValue: "food.ch2",
              noConfirm: true,
            })
            .then(() => {
              const newNote = NoteUtils.getNoteByFnameFromEngine({
                fname: "food.ch2",
                engine,
                vault: vaults[0],
              });
              expect(showQuickPick.calledOnce).toBeTruthy();
              expect(_.trim(newNote?.body)).toEqual(
                "food ch2 template in vault 2"
              );
            });
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
          const { engine, vaults } = ExtensionProvider.getDWorkspace();

          // Escape out, leading to undefined note
          showQuickPick.onFirstCall().returns(Promise.resolve(undefined));
          const cmd = new NoteLookupCommand();
          cmd
            .run({
              initialValue: "food.ch2",
              noConfirm: true,
            })
            .then(() => {
              const newNote = NoteUtils.getNoteByFnameFromEngine({
                fname: "food.ch2",
                engine,
                vault: vaults[0],
              });
              expect(showQuickPick.calledOnce).toBeTruthy();
              expect(_.trim(newNote?.body)).toEqual("");
            });
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
            `Warning: Problem with food schema. No vault found for missingVault`
          );
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
            `Warning: Problem with food schema. No note found for blah`
          );
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
          await setupSchemaCrossVault({ wsRoot, vault, template });
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
            "Warning: Problem with food schema. No note found for food.missing"
          );
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
          const newNote = WSUtils.getNoteFromDocument(document!);
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
          const newNote = WSUtils.getNoteFromDocument(document!);
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
          await WSUtils.openNote(engine.notes["foo"]);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.journal,
            noConfirm: true,
          })) as CommandOutput;

          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          expect(dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(dateFormat);
          const noteName = `foo.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = WSUtils.getNoteFromDocument(
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
          await WSUtils.openNote(engine.notes["foo"]);
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
          await WSUtils.openNote(engine.notes["foo"]);

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
          await WSUtils.openNote(engine.notes["foo"]);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.task,
            noConfirm: true,
          })) as CommandOutput;

          expect(out.quickpick.value.startsWith(`foo`)).toBeTruthy();

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
          await WSUtils.openNote(engine.notes["foo"]);
          const out = (await cmd.run({
            noteType: LookupNoteTypeEnum.journal,
            initialValue: "gamma",
            noConfirm: true,
          })) as CommandOutput;

          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          expect(dateFormat).toEqual("y.MM.dd");
          // quickpick value should be `foo.journal.yyyy.mm.dd`
          const today = Time.now().toFormat(dateFormat);
          const noteName = `gamma.journal.${today}`;
          expect(out.quickpick.value).toEqual(noteName);

          // note title should be overriden.
          const note = WSUtils.getNoteFromDocument(
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
          await WSUtils.openNote(engine.notes["foo"]);

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
          await WSUtils.openNote(engine.notes["foo"]);

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

    test("task modifier toggle", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await WSUtils.openNote(engine.notes["foo"]);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.task,
          });

          let { journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeTruthy();
          expect(controller.quickpick.value.startsWith("task."));

          await controller.onTriggerButton(taskBtn);

          ({ journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("scratch, journal, and task modifiers toggle each other off when triggered", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          await WSUtils.openNote(engine.notes["foo"]);

          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);

          const { controller } = await cmd.gatherInputs({
            noteType: LookupNoteTypeEnum.journal,
          });

          let { journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          expect(journalBtn.pressed).toBeTruthy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value.startsWith("foo.journal."));

          await controller.onTriggerButton(scratchBtn);

          ({ journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeTruthy();
          expect(taskBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value.startsWith("scratch."));

          await controller.onTriggerButton(taskBtn);

          ({ journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeTruthy();
          expect(controller.quickpick.value.startsWith("task."));

          await controller.onTriggerButton(taskBtn);

          ({ journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          ));
          expect(journalBtn.pressed).toBeFalsy();
          expect(scratchBtn.pressed).toBeFalsy();
          expect(taskBtn.pressed).toBeFalsy();
          expect(controller.quickpick.value).toEqual("foo");

          done();
        },
      });
    });

    test("selection modifier set to none in configs", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        modConfigCb: (config: IntermediateDendronConfig) => {
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
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const newNote = WSUtils.getNoteFromDocument(newNoteEditor.document);
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

          // const oldNote = engine.notes["foo"];
          // expect(oldNote.links.length).toEqual(1);
          // expect(oldNote.links[0].value).toEqual("foo.foo-body");
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
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const newNote = WSUtils.getNoteFromDocument(newNoteEditor.document);
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
              ConfigUtils.setNoteLookupProps(config, "leaveTrace", true);
              return config;
            },
            { wsRoot }
          );
          const cmd = new NoteLookupCommand();
          stubVaultPick(vaults);
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const newNote = WSUtils.getNoteFromDocument(newNoteEditor.document);
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
          const newNote = WSUtils.getNoteFromDocument(newNoteEditor.document);
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
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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

          await WSUtils.openNote(engine.notes["foo"]);
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

      const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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

          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          const today = Time.now().toFormat(dateFormat);
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
          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          const today = Time.now().toFormat(dateFormat);
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

      const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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
          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          const today = Time.now().toFormat(dateFormat);
          const quickpickValue = controller.quickpick.value;
          expect(quickpickValue).toEqual(`foo.journal.${today}.foo-body`);

          done();
        },
      });
    });
  });

  describe("task + selection2link interactions", () => {
    const prepareCommandFunc = async ({ vaults, engine }: any) => {
      const cmd = new NoteLookupCommand();
      stubVaultPick(vaults);

      const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

      // selects "foo body"
      fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
      const { text } = VSCodeUtils.getSelection();
      expect(text).toEqual("foo body");

      const { controller } = await cmd.gatherInputs({
        noteType: LookupNoteTypeEnum.task,
        selectionType: LookupSelectionTypeEnum.selection2link,
      });
      return { controller };
    };

    test("task and selection2link both applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { taskBtn } = getNoteTypeButtons(controller.quickpick.buttons);

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(taskBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          const quickpickValue = controller.quickpick.value;
          expect(quickpickValue.startsWith(`foo.`)).toBeTruthy();
          expect(quickpickValue.endsWith(".foo-body")).toBeTruthy();

          done();
        },
      });
    });

    test("toggling task modifier off will only leave selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { taskBtn } = getNoteTypeButtons(controller.quickpick.buttons);

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(taskBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(taskBtn);
          expect(controller.quickpick.value).toEqual(`foo.foo-body`);

          done();
        },
      });
    });

    test("toggling selection2link modifier off will only leave task modifier applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { taskBtn } = getNoteTypeButtons(controller.quickpick.buttons);

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(taskBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(selection2linkBtn);
          const quickpickValue = controller.quickpick.value;
          expect(quickpickValue.startsWith(`foo`)).toBeTruthy();
          expect(quickpickValue.endsWith("foo-body")).toBeFalsy();

          done();
        },
      });
    });

    test("applying journal strips task modifier, and keeps selection2link applied", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ vaults, engine }) => {
          const { controller } = await prepareCommandFunc({ vaults, engine });

          const { journalBtn, taskBtn } = getNoteTypeButtons(
            controller.quickpick.buttons
          );

          const { selection2linkBtn } = getSelectionTypeButtons(
            controller.quickpick.buttons
          );

          expect(taskBtn.pressed).toBeTruthy();
          expect(selection2linkBtn.pressed).toBeTruthy();

          await controller.onTriggerButton(journalBtn);
          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          const today = Time.now().toFormat(dateFormat);
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

      const fooNoteEditor = await WSUtils.openNote(engine.notes["foo"]);

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

          const dateFormat = ConfigUtils.getJournal(engine.config).dateFormat;
          const today = Time.now().toFormat(dateFormat);
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

          await WSUtils.openNote(engine.notes["foo"]);
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

          await WSUtils.openNote(engine.notes["foo"]);

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

suite("stateService", function () {
  let homeDirStub: SinonStub;
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async (ctx) => {
      new StateService(ctx);
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

          done();
        },
      });
    });
  });
});
