import { ConfigUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestConfigUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteRefCommand } from "../../commands/CopyNoteRef";
import { VSCodeUtils } from "../../utils";
import { expect, runMultiVaultTest } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("CopyNoteRef", function () {
  const ctx = setupBeforeAfter(this, {});

  describe("multi", () => {
    test("xvault link when allowed in config", (done) => {
      runMultiVaultTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                true
              );
              return config;
            },
            { wsRoot }
          );
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteRefCommand().run();
          expect(link).toEqual("![[dendron://main/foo]]");
          done();
        },
        preSetupHook: ENGINE_HOOKS.setupBasic,
      });
    });

    test("no xvault link when disabled in config", (done) => {
      runMultiVaultTest({
        ctx,
        onInit: async ({ wsRoot, vaults }) => {
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setWorkspaceProp(
                config,
                "enableXVaultWikiLink",
                false
              );
              return config;
            },
            { wsRoot }
          );
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteRefCommand().run();
          expect(link).toEqual("![[foo]]");
          done();
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
      });
    });
  });

  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ engine }) => {
        const note = engine.notes["foo"];
        await VSCodeUtils.openNote(note);
        const link = await new CopyNoteRefCommand().run();
        expect(link).toEqual("![[foo]]");
        done();
      },
    });
  });

  test("with selection", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n## Header\n Header text",
          vault: opts.vaults[0],
          props: {
            id: `${rootName}`,
          },
          wsRoot: opts.wsRoot,
        });
      },
      onInit: async ({ engine }) => {
        const note = engine.notes["bar"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(7, 0, 7, 12);
        const link = await new CopyNoteRefCommand().run();
        expect(link).toEqual("![[bar#foo,1:#*]]");
        done();
      },
    });
  });

  test("with partial selection", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n## Header\n Header text",
          vault: opts.vaults[0],
          props: {
            id: `${rootName}`,
          },
          wsRoot: opts.wsRoot,
        });
      },
      onInit: async ({ engine }) => {
        const note = engine.notes["bar"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(7, 0, 7, 4);
        const link = await new CopyNoteRefCommand().run();
        expect(link).toEqual("![[bar#foo,1:#*]]");
        done();
      },
    });
  });

  test("with selection and no next header", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: "## Foo\nfoo text\n",
          vault: opts.vaults[0],
          props: {
            id: `${rootName}`,
          },
          wsRoot: opts.wsRoot,
        });
      },
      onInit: async ({ engine }) => {
        const note = engine.notes["bar"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(7, 0, 7, 12);
        const link = await new CopyNoteRefCommand().run();
        expect(link).toEqual("![[bar#foo,1]]");
        done();
      },
    });
  });

  test("with existing block anchor selection", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: [
            "Sint est quis sint sed.",
            "Dicta vel nihil tempora. ^test-anchor",
            "",
            "A est alias unde quia quas.",
            "Laborum corrupti porro iure.",
            "",
            "Id perspiciatis est adipisci.",
          ].join("\n"),
          vault: opts.vaults[0],
          props: {
            id: `${rootName}`,
          },
          wsRoot: opts.wsRoot,
        });
      },
      onInit: async ({ engine }) => {
        const note = engine.notes["bar"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(8, 0, 8, 0);
        const link = await new CopyNoteRefCommand().run();
        expect(link).toEqual("![[bar#^test-anchor]]");
        done();
      },
    });
  });

  function getAnchorsFromLink(link: string, expectedCount?: number): string[] {
    const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
    expect(anchors).toBeTruthy();
    if (!_.isUndefined(expectedCount))
      expect(anchors!.length).toEqual(expectedCount);
    for (const anchor of anchors!) {
      expect(anchor.length > 0).toBeTruthy();
    }
    return anchors!;
  }

  test("with generated block anchors", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
        const rootName = "bar";
        await NoteTestUtilsV4.createNote({
          fname: `${rootName}`,
          body: [
            "Sint est quis sint sed.",
            "Dicta vel nihil tempora. ^test-anchor",
            "",
            "A est alias unde quia quas.",
            "Laborum corrupti porro iure.",
            "",
            "Id perspiciatis est adipisci.",
          ].join("\n"),
          vault: opts.vaults[0],
          props: {
            id: `${rootName}`,
          },
          wsRoot: opts.wsRoot,
        });
      },
      onInit: async ({ engine }) => {
        const note = engine.notes["bar"];
        const editor = await VSCodeUtils.openNote(note);
        editor.selection = new vscode.Selection(8, 0, 11, 0);
        const link = await new CopyNoteRefCommand().run();

        // make sure the link is correct
        expect(link!.startsWith("![[bar#^test-anchor:#^"));
        expect(link!.endsWith("]]"));

        // make sure we only added 1 block anchor (there should be 2 now)
        AssertUtils.assertTimesInString({
          body: editor.document.getText(),
          match: [[2, /\^[a-zA-Z0-9-_]+/]],
        });

        // make sure the anchor in the link has been inserted into the document
        const anchor = getAnchorsFromLink(link!, 2)[1];
        AssertUtils.assertTimesInString({
          body: editor.document.getText(),
          match: [[1, anchor]],
        });
        done();
      },
    });
  });
});
