import {
  ConfigUtils,
  DendronError,
  NoteChangeEntry,
  NoteProps,
  TreeItemLabelTypeEnum,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { EngineNoteProvider } from "../../views/EngineNoteProvider";
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
          onInit: async ({ vaults, wsRoot }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });

            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

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
          onInit: async ({ vaults, wsRoot }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });

            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

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
          onInit: async ({ vaults, wsRoot }) => {
            const testNoteProps = await NoteTestUtilsV4.createNote({
              fname: "alpha",
              vault: vaults[0],
              wsRoot,
            });

            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

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
        "WHEN treeItemLabelType is omitted",
        {
          preSetupHook: preSetupHookFunc,
          modConfigCb: (config) => {
            // @ts-ignore
            delete config.workspace.views;
            return config;
          },
        },
        () => {
          test("THEN label and sort tree items by title", async () => {
            const { config } = ExtensionProvider.getDWorkspace();
            expect(ConfigUtils.getTreeItemLabelType(config)).toEqual(
              TreeItemLabelTypeEnum.title
            );
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

            const props = await (provider.getChildren() as Promise<
              NoteProps[]
            >);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            expect(children?.map((child) => child.title)).toEqual([
              "Zebra", // nav_order: 1
              "Aardvark", // uppercase alphabets comes before underscore alphabets
              "_underscore", // underscore comes before lowercase alphabets
              "aaron",
            ]);
          });
        }
      );
      describeMultiWS(
        "WHEN treeItemLabelType is title",
        {
          preSetupHook: preSetupHookFunc,
          modConfigCb: (config) => {
            config.workspace.views.treeView.treeItemLabelType =
              TreeItemLabelTypeEnum.title;
            return config;
          },
        },
        () => {
          test("THEN label and sort tree items by title", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

            const props = await (provider.getChildren() as Promise<
              NoteProps[]
            >);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            expect(children?.map((child) => child.title)).toEqual([
              "Zebra", // nav_order: 1
              "Aardvark", // uppercase alphabets comes before underscore alphabets
              "_underscore", // underscore comes before lowercase alphabets
              "aaron",
            ]);
          });
        }
      );

      describeMultiWS(
        "WHEN treeItemLabelType is filename",
        {
          preSetupHook: preSetupHookFunc,
          modConfigCb: (config) => {
            config.workspace.views.treeView.treeItemLabelType =
              TreeItemLabelTypeEnum.filename;
            return config;
          },
        },
        () => {
          test("THEN label and sort tree items by filename", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

            const props = await (provider.getChildren() as Promise<
              NoteProps[]
            >);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            expect(
              children?.map((child) => _.last(child.fname.split(".")))
            ).toEqual([
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
      },
      () => {
        test("THEN the tree data is correct", async () => {
          const mockEvents = new MockEngineEvents();
          const provider = new EngineNoteProvider(mockEvents);

          const props = await (provider.getChildren() as Promise<NoteProps[]>);
          // 3 Vaults hence 3 root nodes
          expect(props.length === 3);
          // Also check some children:
          props.forEach((props) => {
            switch (props.vault.fsPath) {
              case "vault1": {
                if (
                  props.children.length !== 1 ||
                  props.children[0] !== "foo"
                ) {
                  throw new DendronError({
                    message: "Note children in vault1 incorrect!",
                  });
                }
                break;
              }
              case "vault2": {
                if (
                  props.children.length !== 1 ||
                  props.children[0] !== "bar"
                ) {
                  throw new DendronError({
                    message: "Note children in vault2 incorrect!",
                  });
                }
                break;
              }
              case "vault3": {
                if (props.children.length !== 0) {
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
        },
        () => {
          test("THEN tree item sort order is correct", async () => {
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

            const props = await (provider.getChildren() as Promise<
              NoteProps[]
            >);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            expect(children?.map((child) => child.title)).toEqual([
              "Zebra", // nav_order: 1
              "Aardvark", // uppercase alphabets comes before underscore alphabets
              "_underscore", // underscore comes before lowercase alphabets
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
            const mockEvents = new MockEngineEvents();
            const provider = new EngineNoteProvider(mockEvents);

            const props = await (provider.getChildren() as Promise<
              NoteProps[]
            >);

            const vault1RootProps = props[0];
            const children = await provider.getChildren(vault1RootProps);
            expect(children?.map((child) => child.title)).toEqual([
              "Zebra", // nav_order: 1
              "Tags", // nav_order respected
              "Aardvark", // uppercase alphabets comes before underscore alphabets
              "_underscore", // underscore comes before lowercase alphabets
              "aaron",
            ]);
          });
        }
      );
    });
  });
});
