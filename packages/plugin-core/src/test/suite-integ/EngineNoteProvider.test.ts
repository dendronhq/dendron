import { NoteProps } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS_MULTI } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import * as vscode from "vscode";
import { EngineNoteProvider } from "../../views/EngineNoteProvider";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { MockEngineEvents } from "./MockEngineEvents";

/**
 * Tests the EngineNoteProvider
 */
suite("EngineNoteProvider Tests", function testSuite() {
  const ctx: vscode.ExtensionContext = setupBeforeAfter(this, {});

  // Set test timeout to 2 seconds
  this.timeout(2000);

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

          mockEvents.testFireonNoteCreated(testNoteProps);
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

          mockEvents.testFireonNoteChange(testNoteProps);
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

          mockEvents.testFireonNoteDeleted(testNoteProps);
        },
      });
    });
  });

  describe(`WHEN the engine note provider is providing tree data on the root node`, function () {
    test("THEN the tree data is correct", (done) => {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async () => {
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
                  done({
                    message: "Note children in vault1 incorrect!",
                  } as Error);
                }
                break;
              }
              case "vault2": {
                if (
                  props.children.length !== 1 ||
                  props.children[0] !== "bar"
                ) {
                  done({
                    message: "Note children in vault2 incorrect!",
                  } as Error);
                }
                break;
              }
              case "vault3": {
                if (props.children.length !== 0) {
                  done({
                    message: "Note children in vault3 incorrect!",
                  } as Error);
                }
                break;
              }
              default: {
                done({ message: "Note with unexpected vault found!" } as Error);
              }
            }
          });

          done();
        },
      });
    });
  });
});
