import {
  DendronError,
  NoteChangeEntry,
  TreeViewItemLabelTypeEnum,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { MetadataService } from "@dendronhq/engine-server";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe, after } from "mocha";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { EngineNoteProvider } from "../../views/common/treeview/EngineNoteProvider";
import { ExtensionProvider } from "../../ExtensionProvider";
import { MetadataSvcTreeViewConfig } from "../../views/node/treeview/MetadataSvcTreeViewConfig";
import { expect } from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";
import { MockEngineEvents } from "./MockEngineEvents";

/**
 * Tests the EngineNoteProvider
 */
suite("EngineNoteProvider Tests", function testSuite() {
  // Set test timeout to 2 seconds
  this.timeout(2000);

  describe("general", function () {
    const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});
    describe(`WHEN a note has been created`, function () {
      test("THEN the data provider refresh event gets invoked", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
          onInit: async ({ vaults, wsRoot, engine }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });
            const treeViewConfig = new MetadataSvcTreeViewConfig();
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(
              vscode.Uri.file(wsRoot),
              engine,
              mockEvents,
              treeViewConfig
            );

            provider.onDidChangeTreeData(() => {
              done();
            });

            const entry: NoteChangeEntry = {
              note: testNoteProps,
              status: "create",
            };

            mockEvents.testFireOnNoteChanged([entry]);
          },
        });
      });
    });

    describe(`WHEN a note has been updated`, function () {
      test("THEN the data provider refresh event gets invoked", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
          onInit: async ({ vaults, wsRoot, engine }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });

            const treeViewConfig = new MetadataSvcTreeViewConfig();
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(
              vscode.Uri.file(wsRoot),
              engine,
              mockEvents,
              treeViewConfig
            );

            provider.onDidChangeTreeData(() => {
              done();
            });

            const entry: NoteChangeEntry = {
              prevNote: testNoteProps,
              note: testNoteProps,
              status: "update",
            };

            mockEvents.testFireOnNoteChanged([entry]);
          },
        });
      });
    });

    describe(`WHEN a note has been deleted`, function () {
      test("THEN the data provider refresh event gets invoked", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
          onInit: async ({ vaults, wsRoot, engine }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });

            const treeViewConfig = new MetadataSvcTreeViewConfig();
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(
              vscode.Uri.file(wsRoot),
              engine,
              mockEvents,
              treeViewConfig
            );

            provider.onDidChangeTreeData(() => {
              done();
            });

            const entry: NoteChangeEntry = {
              note: testNoteProps,
              status: "delete",
            };

            mockEvents.testFireOnNoteChanged([entry]);
          },
        });
      });
    });
  });

  describe("tree data", function () {
    const preSetupHookFunc = async (opts: WorkspaceOpts & { extra?: any }) => {
      const { vaults, wsRoot } = opts;
      const vault = vaults[0];
      await NOTE_PRESETS_V4.NOTE_WITH_LOWER_CASE_TITLE.create({
        wsRoot,
        vault,
      });
      await NOTE_PRESETS_V4.NOTE_WITH_UPPER_CASE_TITLE.create({
        wsRoot,
        vault,
      });
      await NOTE_PRESETS_V4.NOTE_WITH_UNDERSCORE_TITLE.create({
        wsRoot,
        vault,
      });
      await NoteTestUtilsV4.createNote({
        wsRoot,
        vault: vaults[0],
        fname: "zebra",
        custom: {
          nav_order: 1,
        },
      });
    };

    describe("sort / label config", function () {
      describeMultiWS(
        "WHEN treeViewItemLabelType is omitted",
        {
          preSetupHook: async (opts) => {
            await preSetupHookFunc(opts);
            MetadataService.instance().deleteMeta("treeViewItemLabelType");
          },
          timeout: 1e6,
        },
        () => {
          test("THEN label and sort tree items by title", async () => {
            expect(
              MetadataService.instance().getTreeViewItemLabelType()
            ).toEqual(TreeViewItemLabelTypeEnum.title);
            const provider = container.resolve(EngineNoteProvider);

            const props = await (provider.getChildren() as Promise<string[]>);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            const engine = ExtensionProvider.getEngine();
            const titleArray: Promise<string>[] = children?.map(
              async (children) =>
                (await engine.findNotesMeta({ fname: children }))[0].title
            )!;
            const result = await Promise.all(titleArray);
            expect(result).toEqual([
              "Zebra", // nav_order: 1
              "_underscore", // underscore comes first
              "Aardvark",
              "aaron",
            ]);
          });
        }
      );
      describeMultiWS(
        "WHEN treeViewItemLabelType is title",
        {
          preSetupHook: async (opts) => {
            await preSetupHookFunc(opts);
            MetadataService.instance().setTreeViewItemLabelType(
              TreeViewItemLabelTypeEnum.title
            );
          },
        },
        () => {
          after(() => {
            MetadataService.instance().deleteMeta("treeViewItemLabelType");
          });
          test("THEN label and sort tree items by title", async () => {
            const provider = container.resolve(EngineNoteProvider);

            const props = await (provider.getChildren() as Promise<string[]>);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            const engine = ExtensionProvider.getEngine();
            const titleArray: Promise<string>[] = children?.map(
              async (children) =>
                (await engine.findNotesMeta({ fname: children }))[0].title
            )!;
            const result = await Promise.all(titleArray);
            expect(result).toEqual([
              "Zebra", // nav_order: 1
              "_underscore", // underscore comes before alphabets
              "Aardvark",
              "aaron",
            ]);
          });
        }
      );

      describeMultiWS(
        "WHEN treeViewItemLabelType is filename",
        {
          preSetupHook: async (opts) => {
            await preSetupHookFunc(opts);
            MetadataService.instance().setTreeViewItemLabelType(
              TreeViewItemLabelTypeEnum.filename
            );
          },
        },
        () => {
          after(() => {
            MetadataService.instance().deleteMeta("treeViewItemLabelType");
          });
          test("THEN label and sort tree items by filename", async () => {
            const provider = container.resolve(EngineNoteProvider);

            const props = await (provider.getChildren() as Promise<string[]>);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            const engine = ExtensionProvider.getEngine();
            const titleArray: Promise<string>[] = children?.map(
              async (children) =>
                (await engine.findNotesMeta({ fname: children }))[0].fname
            )!;
            const result = await Promise.all(titleArray);
            expect(result.map((fname) => _.last(fname.split(".")))).toEqual([
              "zebra", // nav_order: 1
              "_underscore", // underscore comes before lowercase alphabets
              "aardvark",
              "aaron",
            ]);
          });
        }
      );
    });

    describeMultiWS(
      "WHEN the engine note provider is providing tree data on the root node",
      {
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        timeout: 1e6,
      },
      () => {
        test("THEN the tree data is correct", async () => {
          const provider = container.resolve(EngineNoteProvider);

          const props = await (provider.getChildren() as string[]);
          const engine = ExtensionProvider.getEngine();
          // 3 Vaults hence 3 root nodes
          expect(props.length === 3);
          // Also check some children:
          props.forEach(async (props) => {
            const note = await (await engine.getNote(props)).data;
            if (note) {
              switch (note.vault.fsPath) {
                case "vault1": {
                  if (
                    note.children.length !== 1 ||
                    note.children[0] !== "foo"
                  ) {
                    throw new DendronError({
                      message: "Note children in vault1 incorrect!",
                    });
                  }
                  break;
                }
                case "vault2": {
                  if (
                    note.children.length !== 1 ||
                    note.children[0] !== "bar"
                  ) {
                    throw new DendronError({
                      message: "Note children in vault2 incorrect!",
                    });
                  }
                  break;
                }
                case "vault3": {
                  if (note.children.length !== 0) {
                    throw new DendronError({
                      message: "Note children in vault3 incorrect!",
                    });
                  }
                  break;
                }
                default: {
                  throw new DendronError({
                    message: "Note with unexpected vault found!",
                  });
                }
              }
            } else {
              throw new DendronError({
                message: "Notenot found",
              });
            }
          });
        });
      }
    );

    describe("WHEN the engine note provider is providing tree data on the root node with children", function () {
      describeMultiWS(
        "AND tags hierarchy doesn't specify nav_order",
        {
          preSetupHook: async (opts) => {
            const { vaults, wsRoot } = opts;
            const vault = vaults[0];
            await preSetupHookFunc(opts);
            await NoteTestUtilsV4.createNote({
              wsRoot,
              vault,
              fname: "tags.aa-battery",
            });
          },
          timeout: 1e6,
        },
        () => {
          test("THEN tree item sort order is correct", async () => {
            const provider = container.resolve(EngineNoteProvider);

            const props = await (provider.getChildren() as Promise<string[]>);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            const engine = ExtensionProvider.getEngine();
            const titleArray = children?.map(async (children) => {
              const resp = await engine.getNote(children);
              return resp.data?.title;
            })!;
            const result = await Promise.all(titleArray);
            expect(result).toEqual([
              "Zebra", // nav_order: 1
              "_underscore", // underscore comes before alphabets
              "Aardvark",
              "aaron",
              "Tags", // tags come last.
            ]);
          });
        }
      );

      describeMultiWS(
        "AND tags hierarchy doesn't specify nav_order",
        {
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await preSetupHookFunc(opts);
            await NoteTestUtilsV4.createNote({
              wsRoot,
              vault: vaults[0],
              fname: "tags",
              custom: {
                nav_order: 1.2,
              },
            });
            await NoteTestUtilsV4.createNote({
              wsRoot,
              vault: vaults[0],
              fname: "tags.aa-battery",
            });
          },
        },
        () => {
          test("THEN tag hierarchy nav_order is respected", async () => {
            const provider = container.resolve(EngineNoteProvider);

            const props = await (provider.getChildren() as Promise<string[]>);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            const engine = ExtensionProvider.getEngine();
            const titleArray: Promise<string>[] = children?.map(
              async (children) =>
                (await engine.findNotesMeta({ fname: children }))[0].title
            )!;
            const result = await Promise.all(titleArray);
            expect(result).toEqual([
              "Zebra", // nav_order: 1
              "Tags", // nav_order respected
              "_underscore", // underscore comes before alphabets
              "Aardvark",
              "aaron",
            ]);
          });
        }
      );
    });
  });
});
