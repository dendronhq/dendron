import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { RefactorHierarchyCommandV2 } from "../../commands/RefactorHierarchyV2";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import sinon from "sinon";
import { getEngine } from "../../workspace";
import {
  DNodeProps,
  DNodeUtils,
  DVault,
  NoteUtils,
} from "@dendronhq/common-all";
import { NoteLookupProviderSuccessResp } from "../../components/lookup/LookupProviderV3";

suite("RefactorHiearchy", function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("GIVEN a workspace with some notes with simple hierarchy", () => {
    let note: DNodeProps;
    let noteOne: DNodeProps;
    let noteTwo: DNodeProps;
    let preSetupHook: PreSetupHookFunction;

    beforeEach(() => {
      preSetupHook = async (opts: { wsRoot: string; vaults: DVault[] }) => {
        const { wsRoot, vaults } = opts;
        const vault = vaults[0];
        note = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor",
          body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
        });
        noteOne = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor.one",
          body: ["- [[refactor.two]]"].join("\n"),
        });
        noteTwo = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "refactor.two",
          body: [""].join("\n"),
        });
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("WHEN scope is undefined", () => {
      test("THEN scope is all existing notes, all notes and links refactored.", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: async () => {
            const cmd = new RefactorHierarchyCommandV2();
            await cmd.execute({
              scope: undefined,
              match: "refactor(.*)",
              replace: "prefix$1",
              noConfirm: true,
            });

            const engine = getEngine();
            const { vaults, wsRoot } = engine;
            const vault = vaults[0];
            const vpath = vault2Path({ vault, wsRoot });
            const notes = fs.readdirSync(vpath).join("");
            const exist = ["prefix.md", "prefix.one.md", "prefix.two.md"];
            const notExist = [
              "refactor.md",
              "refactor.one.md",
              "refactor.two.md",
            ];
            expect(
              await AssertUtils.assertInString({
                body: notes,
                match: exist,
                nomatch: notExist,
              })
            ).toBeTruthy();

            const noteAfterRefactor = NoteUtils.getNoteByFnameV5({
              fname: "prefix",
              notes: engine.notes,
              vault,
              wsRoot,
            });
            expect(noteAfterRefactor?.body).toEqual(
              "- [[prefix.one]]\n- [[prefix.two]]\n"
            );
            done();
          },
        });
      });
    });

    describe("WHEN scoped to one note", () => {
      test("THEN only refactor that note and links to it.", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: async () => {
            const cmd = new RefactorHierarchyCommandV2();
            const scope: NoteLookupProviderSuccessResp = {
              selectedItems: [
                {
                  ...noteTwo,
                  label: "refactor.two",
                },
              ],
              onAcceptHookResp: [],
            };
            await cmd.execute({
              scope,
              match: "refactor(.*)",
              replace: "prefix$1",
              noConfirm: true,
            });

            const engine = getEngine();
            const { vaults, wsRoot } = engine;
            const vault = vaults[0];
            const vpath = vault2Path({ vault, wsRoot });
            const notes = fs.readdirSync(vpath).join("");
            const exist = ["refactor.md", "refactor.one.md", "prefix.two.md"];
            const notExist = ["prefix.md", "prefix.one.md", "refactor.two.md"];
            expect(
              await AssertUtils.assertInString({
                body: notes,
                match: exist,
                nomatch: notExist,
              })
            ).toBeTruthy();

            const noteAfterRefactor = NoteUtils.getNoteByFnameV5({
              fname: "refactor",
              notes: engine.notes,
              vault,
              wsRoot,
            });
            expect(noteAfterRefactor?.body).toEqual(
              "- [[refactor.one]]\n- [[prefix.two]]\n"
            );

            const noteOneAfterRefactor = NoteUtils.getNoteByFnameV5({
              fname: "refactor.one",
              notes: engine.notes,
              vault,
              wsRoot,
            });
            expect(noteOneAfterRefactor?.body).toEqual("- [[prefix.two]]\n");
            done();
          },
        });
      });
    });

    describe("WHEN given simple regex match / replace text with capture group", () => {
      test("THEN correctly refactors fname", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: async () => {
            const cmd = new RefactorHierarchyCommandV2();

            const engine = getEngine();
            const { schemas, vaults, wsRoot } = engine;

            const capturedEntries = [note, noteOne, noteTwo].map((ent) => {
              return DNodeUtils.enhancePropForQuickInputV3({
                props: ent,
                schemas,
                vaults,
                wsRoot,
              });
            });

            const operations = cmd.getRenameOperations({
              capturedEntries,
              matchRE: new RegExp("(.*)"),
              replace: "prefix.$1.suffix",
              wsRoot,
            });

            operations.forEach((op) => {
              const newFname = path.basename(op.newUri.path, ".md");
              const oldFname = path.basename(op.oldUri.path, ".md");
              expect(newFname.startsWith("prefix.")).toBeTruthy();
              expect(newFname.endsWith(".suffix")).toBeTruthy();
              expect(newFname.includes(oldFname)).toBeTruthy();
            });
            done();
          },
        });
      });
    });
  });

  describe("GIVEN a workspace with some notes with complex hierarchy", () => {
    let refFooTest: DNodeProps;
    let refBarTest: DNodeProps;
    let refEggTest: DNodeProps;
    let preSetupHook: PreSetupHookFunction;

    beforeEach(() => {
      preSetupHook = async (opts: { wsRoot: string; vaults: DVault[] }) => {
        const { wsRoot, vaults } = opts;
        const vault = vaults[0];

        refFooTest = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "dendron.ref.foo.test",
          body: [""].join("\n"),
        });

        refBarTest = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "dendron.ref.bar.test",
          body: [""].join("\n"),
        });

        refEggTest = await NoteTestUtilsV4.createNote({
          vault,
          wsRoot,
          fname: "dendron.ref.egg.test",
          body: [""].join("\n"),
        });
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("WHEN a complex regex match (lookaround) / replace text with (named) capture/non-capture group is given", () => {
      test("THEN correctly refactors fname", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          preSetupHook,
          onInit: async () => {
            const cmd = new RefactorHierarchyCommandV2();

            const engine = getEngine();
            const { schemas, vaults, wsRoot } = engine;

            const capturedEntries = [refFooTest, refBarTest, refEggTest].map(
              (ent) => {
                return DNodeUtils.enhancePropForQuickInputV3({
                  props: ent,
                  schemas,
                  vaults,
                  wsRoot,
                });
              }
            );

            const operations = cmd.getRenameOperations({
              capturedEntries,
              // capture two depth of hierarchy if parent is "ref"
              // discard whatever comes before "ref"
              matchRE: new RegExp("(?:.*)(?<=ref)\\.(\\w*)\\.(?<rest>.*)"),
              replace: "pkg.$<rest>.$1.ref",
              wsRoot,
            });

            operations.forEach((op) => {
              const newFname = path.basename(op.newUri.path, ".md");
              const oldFname = path.basename(op.oldUri.path, ".md");
              expect(newFname.startsWith("pkg.test.")).toBeTruthy();
              expect(newFname.endsWith(".ref")).toBeTruthy();
              expect(oldFname.split(".")[2]).toEqual(newFname.split(".")[2]);
            });
            done();
          },
        });
      });
    });
  });
});
