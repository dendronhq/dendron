import {
  DNodePropsQuickInputV2,
  DNodeUtils,
  NoteProps,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NOTE_PRESETS_V4,
  runJestHarnessV2,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import {
  ENGINE_HOOKS,
  ENGINE_QUERY_PRESETS,
  ENGINE_WRITE_PRESETS,
} from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import {
  LookupCommand,
  LookupNoteTypeEnum,
} from "../../commands/LookupCommand";
import { createAllButtons } from "../../components/lookup/buttons";
import { LookupControllerV2 } from "../../components/lookup/LookupControllerV2";
import { LookupProviderV2 } from "../../components/lookup/LookupProviderV2";
import { NotePickerUtils, PickerUtilsV2 } from "../../components/lookup/utils";
import { CONFIG } from "../../constants";
import { EngineFlavor, EngineOpts } from "../../types";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { createMockQuickPick } from "../testUtils";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import {
  createEngineFactory,
  EditorUtils,
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

const { createNoActiveItem } = NotePickerUtils;

const createEngineForSchemaUpdateItems = createEngineFactory({
  querySchema: (_opts: WorkspaceOpts) => {
    const querySchema: DendronEngineV2["querySchema"] = async (qs) => {
      const engOpts: EngineOpts = { flavor: "schema" };
      const ws = DendronWorkspace.instance();
      const client = ws.getEngine();
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const quickpick = await lc.show();
      quickpick.value = qs;
      await lp.onUpdatePickerItem(
        quickpick,
        engOpts,
        "manual",
        lc.cancelToken.token
      );
      const schemaModules = _.map(
        lc.quickPick?.items,
        (ent) => client.schemas[ent.id]
      ).filter((ent) => !_.isUndefined(ent));
      return {
        data: schemaModules,
        error: null,
      };
    };
    return querySchema;
  },
});

const createEngineForNoteUpdateItems = createEngineFactory({
  queryNotes: (_opts: WorkspaceOpts) => {
    const queryNotes: DendronEngineV2["queryNotes"] = async (opts) => {
      return new Promise(async (resolve) => {
        const engOpts: EngineOpts = { flavor: "note" };
        const ws = DendronWorkspace.instance();
        const client = ws.getEngine();
        const lc = new LookupControllerV2(engOpts);
        const lp = new LookupProviderV2(engOpts);
        const quickpick = await lc.show();
        quickpick.value = opts.qs;
        const newPicker = await lp.onUpdatePickerItem(
          quickpick,
          { ...engOpts, force: true },
          "manual",
          lc.cancelToken.token
        );
        let data = _.map(
          newPicker?.items,
          (ent) => client.notes[ent.id]
        ).filter((ent) => !_.isUndefined(ent));
        if (opts.vault) {
          // NOTE: this is a hack
          data = data.filter(
            (ent) =>
              path.basename(ent.vault.fsPath) ===
              path.basename(opts.vault?.fsPath as string)
          );
        }
        resolve({ data, error: null });

        // return {
        //   data,
        //   error: null,
        // };
      });
    };
    return queryNotes;
  },
});

const lookupHelper = async (flavor: EngineFlavor) => {
  const engOpts: EngineOpts = { flavor };
  const lc = new LookupControllerV2(engOpts);
  const lp = new LookupProviderV2(engOpts);
  const picker = await lc.show();
  return { lc, lp, picker };
};

const lookupHelperForNote = async () => {
  const engOpts: EngineOpts = { flavor: "note" };
  const lc = new LookupControllerV2(engOpts);
  const lp = new LookupProviderV2(engOpts);
  const picker = createMockQuickPick({});

  return { lc, lp, picker };
};

const schemaAcceptHelper = async (qs: string) => {
  const engOpts: EngineOpts = { flavor: "schema" };
  const ws = DendronWorkspace.instance();
  const client = ws.getEngine();
  const schemaModule = client.schemas[qs];
  const schemaInput = SchemaUtils.enhanceForQuickInput({
    props: schemaModule,
    vaults: DendronWorkspace.instance().config.vaults,
  });
  const quickpick = createMockQuickPick({
    value: qs,
    selectedItems: [schemaInput],
  });
  const lc = new LookupControllerV2(engOpts);
  const lp = new LookupProviderV2(engOpts);
  const resp = await lp.onDidAccept({
    picker: quickpick,
    opts: engOpts,
    lc,
  });
  return resp?.uris;
};

const createEngineForSchemaAcceptQuery = createEngineFactory({
  writeSchema: (_opts: WorkspaceOpts) => {
    const func: DendronEngineV2["writeSchema"] = async (schema) => {
      const engOpts: EngineOpts = { flavor: "schema" };
      const quickpick = createMockQuickPick({
        value: schema.fname,
        selectedItems: [NotePickerUtils.createNoActiveItem(schema.vault)],
      });
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      await lp.onDidAccept({
        picker: quickpick,
        opts: engOpts,
        lc,
      });
      await quickpick.hide();
    };
    return func;
  },
  querySchema: (_opts: WorkspaceOpts) => {
    const querySchema: DendronEngineV2["querySchema"] = async (qs) => {
      const uris = await schemaAcceptHelper(qs);
      const schemas = uris?.map((ent) => {
        return SchemaUtils.getSchemaModuleByFnameV4({
          fname: path.basename(ent.fsPath, ".schema.yml"),
          schemas: getWS().getEngine().schemas,
          vault: { fsPath: path.dirname(ent.fsPath) },
          wsRoot: _opts.wsRoot,
        });
      }) as SchemaModuleProps[];
      return {
        error: null,
        data: schemas,
      };
    };
    return querySchema;
  },
});

const createEngineForNoteAcceptNewItem = createEngineFactory({
  writeNote: (_opts: WorkspaceOpts) => {
    const func: DendronEngineV2["writeNote"] = async (note) => {
      const engOpts: EngineOpts = { flavor: "note" };
      const quickpick = createMockQuickPick({
        value: note.fname,
        selectedItems: [createNoActiveItem(note.vault)],
      });
      const lc = new LookupControllerV2(engOpts);
      const lp = new LookupProviderV2(engOpts);
      const resp = await lp.onDidAccept({
        picker: quickpick,
        opts: engOpts,
        lc,
      });
      if (_.isUndefined(resp)) {
        throw Error("resp is undefined");
      }
      return resp.resp;
    };
    return func;
  },
  queryNotes: (_opts: WorkspaceOpts) => {
    const queryNotes: DendronEngineV2["queryNotes"] = async (opts) => {
      return getWS().getEngine().queryNotes(opts);
    };
    return queryNotes;
  },
});

suite("Lookup, schemas", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe("updateItems", () => {
    _.map(
      ENGINE_QUERY_PRESETS["SCHEMAS"],
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaUpdateItems({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );
  });

  describe("onAccept", () => {
    _.map(
      _.pick(ENGINE_QUERY_PRESETS["SCHEMAS"], "SIMPLE"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaAcceptQuery({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );

    _.map(
      _.pick(ENGINE_WRITE_PRESETS.SCHEMAS, "ADD_NEW_MODULE_NO_CHILD"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForSchemaAcceptQuery({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );
  });
});

suite("Lookup, notesv2", function () {
  const engOpts: EngineOpts = { flavor: "note" };

  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {
    afterHook: async () => {
      sinon.restore();
    },
  });

  // TODO: flaky test, can run by itself
  describe.skip("updateItems", () => {
    _.forEach(
      ENGINE_QUERY_PRESETS["NOTES"],
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacySingleWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForNoteUpdateItems({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
                extra: { vscode: true },
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );

    // migrated
    test("opened note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async () => {
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupControllerV2(engOpts);
          const lp = new LookupProviderV2(engOpts);
          const root = DendronWorkspace.wsRoot();
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(root, "vault1", "foo.md"))
          );
          const quickpick = await lc.show();
          quickpick.onDidChangeActive(() => {
            expect(lc.quickPick?.activeItems.length).toEqual(1);
            expect(lc.quickPick?.activeItems[0].fname).toEqual("foo");
            done();
          });
          await lp.onUpdatePickerItem(
            quickpick,
            engOpts,
            "manual",
            lc.cancelToken.token
          );
        },
      });
    });

    // migrated
    test("remove stub status after creation", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
            vault: vaults[0],
            wsRoot,
          });
        },
        onInit: async () => {
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupControllerV2(engOpts);
          const lp = new LookupProviderV2(engOpts);

          const quickpick = await lc.show();
          let note = _.find(quickpick.items, {
            fname: "foo",
          }) as DNodePropsQuickInputV2;
          expect(note.stub).toBeTruthy();
          quickpick.selectedItems = [note];
          await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
          lc.onDidHide(async () => {
            expect(
              path.basename(
                VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
              )
            ).toEqual("foo.md");
            const lc2 = new LookupControllerV2(engOpts);
            const quickpick2 = await lc2.show();
            note = _.find(quickpick2.items, {
              fname: "foo",
            }) as DNodePropsQuickInputV2;
            expect(note.stub).toBeFalsy();
            done();
          });
          quickpick.hide();
        },
      });
    });

    // skip
    test("schema suggestion", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          const vpath = vault2Path({ vault: vaults[0], wsRoot });
          fs.removeSync(path.join(vpath, "foo.ch1.md"));
        },
        onInit: async () => {
          const { lc, lp, picker: quickpick } = await lookupHelper("note");
          quickpick.value = "foo.";
          await lp.onUpdatePickerItem(
            quickpick,
            { flavor: "note" },
            "manual",
            lc.cancelToken.token
          );
          const schemaItem = _.pick(
            _.find(quickpick.items, { fname: "foo.ch1" }),
            ["fname", "schemaStub"]
          );
          await runJestHarnessV2(
            [
              {
                actual: schemaItem,
                expected: {
                  fname: "foo.ch1",
                  schemaStub: true,
                },
              },
            ],
            expect
          );
          done();
        },
      });
    });

    test("filter by depth", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
          await NOTE_PRESETS_V4.NOTE_SIMPLE_GRANDCHILD.create({
            wsRoot,
            vault: vaults[0],
          });
        },
        onInit: async () => {
          const { picker: quickpick, lp, lc } = await lookupHelper("note");
          quickpick.value = "foo.";
          quickpick.showDirectChildrenOnly = true;
          await lp.onUpdatePickerItem(
            quickpick,
            { flavor: "note" },
            "manual",
            lc.cancelToken.token
          );
          expect(quickpick.items.length).toEqual(4);
          expect(_.find(quickpick.items, { fname: "foo.ch1.gch1" })).toEqual(
            undefined
          );
          done();
        },
      });
    });
  });

  describe("onAccept with modifiers", () => {
    test("with lookupPrompt on current vault", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const engOpts: EngineOpts = { flavor: "note" };
          withConfig(
            (config) => {
              config.lookupConfirmVaultOnCreate = true;
              return config;
            },
            { wsRoot }
          );

          const vault = vaults[0];
          const { lc, lp, picker } = await lookupHelperForNote();
          await lc.updatePickerBehavior({ quickPick: picker, provider: lp });

          picker.value = "alpha";
          sinon.stub(picker, "selectedItems").get(() => {
            return [createNoActiveItem(vault)];
          });
          sinon
            .stub(PickerUtilsV2, "promptVault")
            .returns(Promise.resolve(vaults[0]));

          await lp.onDidAccept({
            picker,
            opts: engOpts,
            lc,
          });
          expect(
            (await EditorUtils.getURIForActiveEditor()).fsPath.endsWith(
              path.join("vault1", "alpha.md")
            )
          ).toBeTruthy();
          done();
        },
      });
    });

    test("with lookupPrompt on other vault", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          const engOpts: EngineOpts = { flavor: "note" };
          withConfig(
            (config) => {
              config.lookupConfirmVaultOnCreate = true;
              return config;
            },
            { wsRoot }
          );

          const vault = vaults[0];
          const { lc, lp, picker } = await lookupHelperForNote();
          await lc.updatePickerBehavior({ quickPick: picker, provider: lp });

          picker.value = "alpha";
          sinon.stub(picker, "selectedItems").get(() => {
            return [createNoActiveItem(vault)];
          });
          sinon
            .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
            .returns(Promise.resolve(vaults[1]));

          await lp.onDidAccept({
            picker,
            opts: engOpts,
            lc,
          });
          expect(
            (await EditorUtils.getURIForActiveEditor()).fsPath.endsWith(
              path.join("vault2", "alpha.md")
            )
          ).toBeTruthy();
          done();
        },
      });
    });

    test("scratch config in yml ", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        wsSettingsOverride: {
          settings: {
            [CONFIG.DEFAULT_JOURNAL_NAME.key]: "scratch",
          },
        },
        modConfigCb: (config) => {
          config.scratch!.name = "testScratch" ;
          return config;
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new LookupCommand();
          const note = getWS().getEngine().notes["foo"];
          await VSCodeUtils.openNote(note);
          await cmd.run({
            noConfirm: true,
            noteType: LookupNoteTypeEnum.scratch,
            flavor: "note",
          });
          expect(
            path
              .basename(
                VSCodeUtils.getActiveTextEditorOrThrow().document.uri.fsPath
              )
              .startsWith("testScratch")
          ).toBeTruthy();
          done();
        },
      });
    });
  });

  // TODO: don't skip
  describe("onAccept", () => {
    _.map(
      _.pick(ENGINE_WRITE_PRESETS["NOTES"], "NEW_DOMAIN"),
      (TestCase: TestPresetEntryV4, name) => {
        test(name, (done) => {
          const { testFunc, preSetupHook } = TestCase;
          runLegacyMultiWorkspaceTest({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
              await preSetupHook({
                wsRoot,
                vaults,
              });
            },
            onInit: async ({ vaults, wsRoot }) => {
              const engineMock = createEngineForNoteAcceptNewItem({
                wsRoot,
                vaults,
              });
              const results = await testFunc({
                engine: engineMock,
                vaults,
                wsRoot,
                initResp: {} as any,
              });
              await runJestHarnessV2(results, expect);
              done();
            },
          });
        });
      }
    );

    test("with override", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async () => {
          const cmd = new LookupCommand();
          const note = getWS().getEngine().notes["foo"];
          await VSCodeUtils.openNote(note);
          await cmd.run({
            noConfirm: true,
            value: "gamma",
            noteType: LookupNoteTypeEnum.journal,
            flavor: "note",
          });
          expect(
            path
              .basename(
                VSCodeUtils.getActiveTextEditorOrThrow().document.uri.fsPath
              )
              .startsWith("gamma.journal")
          ).toBeTruthy();
          done();
        },
      });
    });

    test("existing note", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
        onInit: async ({ vaults, wsRoot }) => {
          const { lp, lc } = await lookupHelper("note");
          const ws = DendronWorkspace.instance();
          const client = ws.getEngine();
          const note = NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes: client.notes,
            vault: vaults[0],
            wsRoot: DendronWorkspace.wsRoot(),
          }) as NoteProps;
          const item = DNodeUtils.enhancePropForQuickInput({
            wsRoot,
            props: note,
            schemas: client.schemas,
            vaults: DendronWorkspace.instance().config.vaults,
          });
          const quickpick = createMockQuickPick({
            value: "foo",
            selectedItems: [item],
          });
          await lp.onDidAccept({
            picker: quickpick,
            opts: { flavor: "note" },
            lc,
          });

          await runJestHarnessV2(
            [
              {
                actual: DNodeUtils.fname(
                  VSCodeUtils.getActiveTextEditor()?.document.uri
                    .fsPath as string
                ),
                expected: "foo",
              },
              {
                actual: _.pick(getNoteFromTextEditor(), "title"),
                expected: {
                  title: "Foo",
                },
              },
            ],
            expect
          );
          done();
        },
      });
    });

    test("lookup new node with schema template", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
        },
        onInit: async ({ vaults }) => {
          const { lp, lc } = await lookupHelper("note");
          const picker = createMockQuickPick({
            value: "bar.ch1",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          const engOpts: EngineOpts = { flavor: "note" };
          await lp.onUpdatePickerItem(
            picker,
            engOpts,
            "manual",
            new CancellationTokenSource().token
          );
          await lp.onDidAccept({ picker, opts: engOpts, lc });
          const node = getNoteFromTextEditor();
          await runJestHarnessV2(
            [
              {
                actual: _.trim(node.body),
                expected: "ch1 template",
              },
            ],
            expect
          );
          done();
        },
      });
    });

    test("lookup new node with schema template on namespace", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupSchemaPresetWithNamespaceTemplate({
            wsRoot,
            vaults,
          });
        },
        onInit: async ({ vaults }) => {
          const { lp, lc } = await lookupHelper("note");
          const picker = createMockQuickPick({
            value: "daily.journal.2020.08.10",
            selectedItems: [createNoActiveItem(vaults[0])],
          });
          await lp.onUpdatePickerItem(
            picker,
            engOpts,
            "manual",
            new CancellationTokenSource().token
          );
          await lp.onDidAccept({ picker, opts: engOpts, lc });
          const node = getNoteFromTextEditor();
          await runJestHarnessV2(
            [
              {
                actual: _.trim(node.body),
                expected: "Template text",
              },
            ],
            expect
          );
          done();
        },
      });
    });
  });

  describe("onAccept:multiple", () => {
    test("existing notes", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: async ({ wsRoot, vaults }) => {
          await ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
        onInit: async ({ wsRoot }) => {
          const { lc, lp } = await lookupHelper(engOpts.flavor);
          const client = getWS().getEngine();
          const notes = ["foo", "foo.ch1"].map((fname) => client.notes[fname]);
          const items = notes.map((note) =>
            DNodeUtils.enhancePropForQuickInput({
              wsRoot,
              props: note,
              schemas: client.schemas,
              vaults: DendronWorkspace.instance().config.vaults,
            })
          );
          const quickpick = createMockQuickPick({
            value: "foo",
            selectedItems: items,
          });
          quickpick.canSelectMany = true;
          await lp.onDidAccept({ picker: quickpick, opts: engOpts, lc });
          const openWindows = vscode.workspace.textDocuments.map((ent) =>
            path.basename(ent.uri.fsPath, ".md")
          );
          await runJestHarnessV2(
            [
              {
                actual: _.every(
                  notes.map((n) => _.includes(openWindows, n.fname))
                ),
                expected: true,
              },
            ],
            expect
          );
          done();
        },
      });
    });
  });
});

suite("selectionExtract", function () {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  describe("extraction from file not in known vault", () => {
    test("basic", (done) => {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
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

          // select content from above file and do a lookup.
          const vault = vaults[0];
          const picker = createMockQuickPick({
            selectedItems: [createNoActiveItem(vault)],
            buttons: createAllButtons(["selectionExtract"]),
          });

          const { lc, lp } = await lookupHelperForNote();

          await lc.updatePickerBehavior({
            quickPick: picker,
            provider: lp,
            document: editor.document,
            range: new vscode.Range(0, 0, 0, 17),
            quickPickValue: "from-outside",
          });

          const engOpts: EngineOpts = { flavor: "note" };

          lp.onDidAccept({
            picker,
            opts: engOpts,
            lc,
          });

          // original note content should not be altered.
          const newEditor = (await VSCodeUtils.openFileInEditor(
            uri
          )) as vscode.TextEditor;

          expect(newEditor.document.getText()).toEqual(extBody);

          done();
        },
      });
    });
  });
});

// suite.skip("selection2Link", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let lookupOpts: LookupCommandOpts = {
//     noteType: "scratch",
//     selectionType: "selection2link",
//     noConfirm: true,
//     flavor: "note",
//   };
//   let vaultDir: string;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("slug title", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultDir, "foo.md"));
//       const editor = (await VSCodeUtils.openFileInEditor(
//         uri
//       )) as vscode.TextEditor;
//       editor.selection = new vscode.Selection(7, 0, 7, 12);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("scratch"));
//       assert.ok(getActiveEditorBasename().endsWith("foo-body.md"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       useCb: (_vaultDir) => {
//         vaultDir = _vaultDir;
//         return NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
//           vaultDir,
//         });
//       },
//     });
//   });

//   test("no slug title", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultDir, "foo.md"));
//       const editor = (await VSCodeUtils.openFileInEditor(
//         uri
//       )) as vscode.TextEditor;
//       editor.selection = new vscode.Selection(7, 0, 7, 12);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("scratch"));
//       assert.ok(!getActiveEditorBasename().endsWith("foo-body.md"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG.LINK_SELECT_AUTO_TITLE_BEHAVIOR.key]: "none",
//       },
//       useCb: (_vaultDir) => {
//         vaultDir = _vaultDir;
//         return NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
//           vaultDir,
//         });
//       },
//     });
//   });
// });

// suite.skip("scratch notes", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let noteType = "SCRATCH";
//   let lookupOpts: LookupCommandOpts = {
//     noteType: "scratch",
//     selectionType: "selection2link",
//     noConfirm: true,
//     flavor: "note",
//   };
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("basic", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("scratch"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test("add: childOfCurrent", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.ch1.scratch"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "childOfCurrent",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test("add: childOfDomain", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.scratch"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "childOfDomain",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });
// });

// suite.skip("effect buttons", function () {
//   let ctx: vscode.ExtensionContext;
//   this.timeout(TIMEOUT);

//   describe("copy note link", function () {
//     beforeEach(function () {
//       ctx = VSCodeUtils.getOrCreateMockContext();
//       DendronWorkspace.getOrCreate(ctx);
//     });

//     test("basic", function (done) {
//       setupCase2({ ctx }).then(async ({}) => {
//         const engOpts: EngineOpts = { flavor: "note" };
//         const lc = new LookupControllerV2(engOpts);
//         await lc.show();
//         const client = DendronWorkspace.instance().getEngine();
//         const notes = ["foo", "foo.ch1"].map((fname) => client.notes[fname]);
//         const items = notes.map((note) =>
//           DNodeUtils.enhancePropForQuickInput({
//             props: note,
//             schemas: client.schemas,
//             vaults: DendronWorkspace.instance().config.vaults,
//           })
//         );
//         lc.quickPick = createMockQuickPick({
//           value: "foo",
//           selectedItems: items,
//         });
//         (_.find(lc.state.buttons, {
//           type: "multiSelect",
//         }) as MultiSelectBtn).pressed = true;
//         await lc.onTriggerButton(CopyNoteLinkButton.create(true));
//         assert.strictEqual(
//           clipboardy.readSync(),
//           "[[Foo|foo]]\n[[Ch1|foo.ch1]]"
//         );
//         done();
//       });
//     });
//   });
// });

// suite.skip("journal notes", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let noteType = "JOURNAL";
//   let lookupOpts: LookupCommandOpts = {
//     noteType: "journal",
//     noConfirm: true,
//     flavor: "note",
//   };
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("basic", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.journal"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test.skip("add: childOfDomainNamespace", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.ch1.scratch"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "childOfDomainNamespace",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test.skip("add: diff name", function (_done) {});

//   // test creating a daily journal with no note open
//   test("add: asOwnDomain", function (done) {
//     onWSInit(async () => {
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("journal"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "asOwnDomain",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test("add: childOfCurrent", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.ch1.journal"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       lsp: true,
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "childOfCurrent",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });

//   test("add: childOfDomain", function (done) {
//     onWSInit(async () => {
//       const uri = vscode.Uri.file(path.join(vaultPath, "foo.ch1.md"));
//       await vscode.window.showTextDocument(uri);
//       await new LookupCommand().execute(lookupOpts);
//       assert.ok(getActiveEditorBasename().startsWith("foo.journal"));
//       done();
//     });
//     setupDendronWorkspace(root.name, ctx, {
//       configOverride: {
//         [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
//           "childOfDomain",
//       },
//       useCb: createOneNoteOneSchemaPresetCallback,
//     });
//   });
// });
