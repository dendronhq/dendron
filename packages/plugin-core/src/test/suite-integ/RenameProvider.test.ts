import { NoteChangeEntry, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import { before, beforeEach, describe } from "mocha";
import vscode from "vscode";
import RenameProvider from "../../features/RenameProvider";
import { getDWorkspace } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

suite("RenameProvider", function () {
  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  let activeNote: NoteProps;
  let targetNote: NoteProps;
  let editor: vscode.TextEditor;
  let provider: RenameProvider;

  describeMultiWS(
    "GIVEN wikilink",
    {
      ctx,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "[[target]]", // line 7, char 2 ~ 8
            "[[Target|target]]", // line 8, char 9 ~ 15
            "[[Target|dendron://vault1/target]]", // line 9, char 26 ~ 32
            "[[Target|dendron://vault1/target#foo]]", // line 10, 26 ~ 32
          ].join("\n"),
        });
        targetNote = await NoteTestUtilsV4.createNote({
          fname: "target",
          vault: vaults[0],
          wsRoot,
          body: ["# Foo"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link",
          vault: vaults[0],
          wsRoot,
          body: ["[[target]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link-in-another-vault",
          vault: vaults[1],
          wsRoot,
          body: ["[[dendron://vault1/target]]"].join("\n"),
        });
      },
    },
    () => {
      beforeEach(async () => {
        editor = await WSUtils.openNote(activeNote);
        provider = new RenameProvider();
      });
      test("THEN range is properly provided", async () => {
        const positions = [
          new vscode.Position(7, 0),
          new vscode.Position(8, 0),
          new vscode.Position(9, 0),
          new vscode.Position(10, 0),
        ];
        const actualRanges = await Promise.all(
          positions.map(async (position) => {
            const range = await provider.prepareRename(
              editor.document,
              position
            );
            return range;
          })
        );
        const expectRanges = [
          new vscode.Range(
            new vscode.Position(7, 2),
            new vscode.Position(7, 8)
          ),
          new vscode.Range(
            new vscode.Position(8, 9),
            new vscode.Position(8, 15)
          ),
          new vscode.Range(
            new vscode.Position(9, 26),
            new vscode.Position(9, 32)
          ),
          new vscode.Range(
            new vscode.Position(10, 26),
            new vscode.Position(10, 32)
          ),
        ];
        expect(actualRanges).toEqual(expectRanges);
      });

      describe("WHEN rename is executed", () => {
        let executeOut: { changed: NoteChangeEntry[] } | undefined;
        before(async () => {
          provider.targetNote = targetNote;
          executeOut = await provider.executeRename({ newName: "new-target" });
        });
        test("THEN correctly renamed at symbol position", async () => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const active = NoteUtils.getNoteByFnameV5({
            fname: "active",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const expectedBody = [
            "[[new-target]]",
            "[[New Target|new-target]]",
            "[[New Target|dendron://vault1/new-target]]",
            "[[New Target|dendron://vault1/new-target#foo]]",
            "",
          ].join("\n");
          expect(active?.body).toEqual(expectedBody);
        });

        test("AND target note is correctly renamed", (done) => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const newTarget = NoteUtils.getNoteByFnameV5({
            fname: "new-target",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(newTarget).toBeTruthy();
          done();
        });
        test("THEN references to target note is correctly updated", (done) => {
          expect(executeOut?.changed.length).toEqual(6);
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const noteWithLink = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const noteWithLinkInAnotherVault = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link-in-another-vault",
            vault: vaults[1],
            notes,
            wsRoot,
          });

          expect(noteWithLink?.body).toEqual("[[new-target]]\n");
          expect(noteWithLinkInAnotherVault?.body).toEqual(
            "[[dendron://vault1/new-target]]\n"
          );
          done();
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN note references",
    {
      ctx,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "![[target]]", // line 7, char 2 ~ 8
            "![[dendron://vault1/target]]", // line 9, char 26 ~ 32
            "![[dendron://vault1/target#foo]]", // line 10, 26 ~ 32
          ].join("\n"),
        });
        targetNote = await NoteTestUtilsV4.createNote({
          fname: "target",
          vault: vaults[0],
          wsRoot,
          body: ["# Foo"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link",
          vault: vaults[0],
          wsRoot,
          body: ["![[target]]"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link-in-another-vault",
          vault: vaults[1],
          wsRoot,
          body: ["![[dendron://vault1/target]]"].join("\n"),
        });
      },
    },
    () => {
      beforeEach(async () => {
        editor = await WSUtils.openNote(activeNote);
        provider = new RenameProvider();
      });
      test("THEN range is properly provided", async () => {
        const positions = [
          new vscode.Position(7, 1),
          new vscode.Position(8, 1),
          new vscode.Position(9, 1),
        ];
        const actualRanges = await Promise.all(
          positions.map(async (position) => {
            const range = await provider.prepareRename(
              editor.document,
              position
            );
            return range;
          })
        );
        const expectRanges = [
          new vscode.Range(
            new vscode.Position(7, 3),
            new vscode.Position(7, 9)
          ),
          new vscode.Range(
            new vscode.Position(8, 26),
            new vscode.Position(8, 20)
          ),
          new vscode.Range(
            new vscode.Position(9, 26),
            new vscode.Position(9, 20)
          ),
        ];
        expect(actualRanges).toEqual(expectRanges);
      });

      describe("WHEN rename is executed", () => {
        let executeOut: { changed: NoteChangeEntry[] } | undefined;
        before(async () => {
          provider.targetNote = targetNote;
          executeOut = await provider.executeRename({ newName: "new-target" });
        });
        test("THEN correctly renamed at symbol position", async () => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const active = NoteUtils.getNoteByFnameV5({
            fname: "active",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const expectedBody = [
            "![[new-target]]",
            "![[dendron://vault1/new-target]]",
            "![[dendron://vault1/new-target#foo]]",
            "",
          ].join("\n");
          expect(active?.body).toEqual(expectedBody);
        });

        test("AND target note is correctly renamed", (done) => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const newTarget = NoteUtils.getNoteByFnameV5({
            fname: "new-target",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(newTarget).toBeTruthy();
          done();
        });
        test("THEN references to target note is correctly updated", (done) => {
          expect(executeOut?.changed.length).toEqual(6);
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const noteWithLink = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const noteWithLinkInAnotherVault = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link-in-another-vault",
            vault: vaults[1],
            notes,
            wsRoot,
          });

          expect(noteWithLink?.body).toEqual("![[new-target]]\n");
          expect(noteWithLinkInAnotherVault?.body).toEqual(
            "![[dendron://vault1/new-target]]\n"
          );
          done();
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN hashtag",
    {
      ctx,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "#target", // line 7, char 2 ~ 8
          ].join("\n"),
        });
        targetNote = await NoteTestUtilsV4.createNote({
          fname: "tags.target",
          vault: vaults[0],
          wsRoot,
          body: ["# Foo"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link",
          vault: vaults[0],
          wsRoot,
          body: ["#target"].join("\n"),
        });
      },
    },
    () => {
      beforeEach(async () => {
        editor = await WSUtils.openNote(activeNote);
        provider = new RenameProvider();
      });
      test("THEN range is properly provided", async () => {
        const position = new vscode.Position(7, 0);
        const actualRange = await provider.prepareRename(
          editor.document,
          position
        );

        const expectRange = new vscode.Range(
          new vscode.Position(7, 1),
          new vscode.Position(7, 7)
        );
        expect(actualRange).toEqual(expectRange);
      });

      describe("WHEN rename is executed", () => {
        let executeOut: { changed: NoteChangeEntry[] } | undefined;
        before(async () => {
          provider.targetNote = targetNote;
          executeOut = await provider.executeRename({ newName: "new-target" });
        });
        test("THEN correctly renamed at symbol position", async () => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const active = NoteUtils.getNoteByFnameV5({
            fname: "active",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const expectedBody = "#new-target\n";
          expect(active?.body).toEqual(expectedBody);
        });

        test("AND target note is correctly renamed", (done) => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const newTarget = NoteUtils.getNoteByFnameV5({
            fname: "tags.new-target",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(newTarget).toBeTruthy();
          done();
        });
        test("THEN references to target note is correctly updated", (done) => {
          expect(executeOut?.changed.length).toEqual(7);
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const noteWithLink = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link",
            vault: vaults[0],
            notes,
            wsRoot,
          });

          expect(noteWithLink?.body).toEqual("#new-target\n");
          done();
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN frontmatter tag",
    {
      ctx,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "active",
          vault: vaults[0],
          wsRoot,
          props: { tags: "target" },
        });
        targetNote = await NoteTestUtilsV4.createNote({
          fname: "tags.target",
          vault: vaults[0],
          wsRoot,
          body: ["# Foo"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link",
          vault: vaults[0],
          wsRoot,
          props: { tags: "target" },
        });
      },
    },
    () => {
      beforeEach(async () => {
        editor = await WSUtils.openNote(activeNote);
        provider = new RenameProvider();
      });
      test("THEN range is properly provided", async () => {
        const position = new vscode.Position(6, 7);
        const actualRange = await provider.prepareRename(
          editor.document,
          position
        );
        const expectRange = new vscode.Range(
          new vscode.Position(6, 6),
          new vscode.Position(6, 12)
        );
        expect(actualRange).toEqual(expectRange);
      });

      describe("WHEN rename is executed", () => {
        let executeOut: { changed: NoteChangeEntry[] } | undefined;
        before(async () => {
          provider.targetNote = targetNote;
          executeOut = await provider.executeRename({ newName: "new-target" });
        });
        test("THEN correctly renamed at symbol position", async () => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const active = NoteUtils.getNoteByFnameV5({
            fname: "active",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(active?.tags).toEqual("new-target");
        });

        test("AND target note is correctly renamed", (done) => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const newTarget = NoteUtils.getNoteByFnameV5({
            fname: "tags.new-target",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(newTarget).toBeTruthy();
          done();
        });
        test("THEN references to target note is correctly updated", (done) => {
          expect(executeOut?.changed.length).toEqual(7);
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const noteWithLink = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link",
            vault: vaults[0],
            notes,
            wsRoot,
          });

          expect(noteWithLink?.tags).toEqual("new-target");

          done();
        });
      });
    }
  );

  describeMultiWS(
    "GIVEN usertag",
    {
      ctx,
      preSetupHook: async (opts) => {
        const { wsRoot, vaults } = opts;
        activeNote = await NoteTestUtilsV4.createNote({
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "@target", // line 7, char 2 ~ 8
          ].join("\n"),
        });
        targetNote = await NoteTestUtilsV4.createNote({
          fname: "user.target",
          vault: vaults[0],
          wsRoot,
          body: ["# Foo"].join("\n"),
        });
        await NoteTestUtilsV4.createNote({
          fname: "note-with-link",
          vault: vaults[0],
          wsRoot,
          body: ["@target"].join("\n"),
        });
      },
    },
    () => {
      beforeEach(async () => {
        editor = await WSUtils.openNote(activeNote);
        provider = new RenameProvider();
      });
      test("THEN range is properly provided", async () => {
        const position = new vscode.Position(7, 0);
        const actualRange = await provider.prepareRename(
          editor.document,
          position
        );

        const expectRange = new vscode.Range(
          new vscode.Position(7, 1),
          new vscode.Position(7, 7)
        );
        expect(actualRange).toEqual(expectRange);
      });

      describe("WHEN rename is executed", () => {
        let executeOut: { changed: NoteChangeEntry[] } | undefined;
        before(async () => {
          provider.targetNote = targetNote;
          executeOut = await provider.executeRename({ newName: "new-target" });
        });
        test("THEN correctly renamed at symbol position", async () => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const active = NoteUtils.getNoteByFnameV5({
            fname: "active",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          const expectedBody = "@new-target\n";
          expect(active?.body).toEqual(expectedBody);
        });

        test("AND target note is correctly renamed", (done) => {
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const newTarget = NoteUtils.getNoteByFnameV5({
            fname: "user.new-target",
            vault: vaults[0],
            notes,
            wsRoot,
          });
          expect(newTarget).toBeTruthy();
          done();
        });
        test("THEN references to target note is correctly updated", (done) => {
          expect(executeOut?.changed.length).toEqual(7);
          const { vaults, engine, wsRoot } = getDWorkspace();
          const { notes } = engine;
          const noteWithLink = NoteUtils.getNoteByFnameV5({
            fname: "note-with-link",
            vault: vaults[0],
            notes,
            wsRoot,
          });

          expect(noteWithLink?.body).toEqual("@new-target\n");
          done();
        });
      });
    }
  );
});
