import { ConfigUtils, IntermediateDendronConfig } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  PreSetupHookFunction,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteRefCommand } from "../../commands/CopyNoteRef";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("CopyNoteRef", function () {
  describe("WHEN referencing a header", () => {
    const preSetupHook: PreSetupHookFunction = async (opts) => {
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
    };
    describe("WHEN enableSmartRef is true by default", () => {
      describeMultiWS(
        "AND WHEN with header selected",
        {
          preSetupHook,
          timeout: 5e3,
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(7, 0, 7, 12);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();
            expect(link).toEqual(`![[bar#foo]]`);
          });
        }
      );

      describeMultiWS(
        "AND WHEN with partial selection",
        {
          preSetupHook,
          timeout: 5e3,
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(7, 0, 7, 4);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();
            expect(link).toEqual(`![[bar#foo]]`);
          });
        }
      );

      describeMultiWS(
        "AND WHEN no next header",
        {
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
          timeout: 5e3,
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(7, 0, 7, 12);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();
            expect(link).toEqual(`![[bar#foo]]`);
          });
        }
      );

      describeMultiWS(
        "AND WHEN existing block anchor selection",
        {
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
          timeout: 5e3,
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(8, 0, 8, 0);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();
            expect(link).toEqual("![[bar#^test-anchor]]");
          });
        }
      );

      describeMultiWS(
        "AND WHEN generated block anchors",
        {
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
          timeout: 5e3,
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(8, 0, 11, 0);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();

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
          });
        }
      );
    });
  });

  describe("GIVEN multi vault", () => {
    describeMultiWS(
      "WHEN xvault link when allowed in config",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config: IntermediateDendronConfig) => {
          ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", true);
          return config;
        },
        timeout: 5e3,
      },
      () => {
        test("THEN create xvault link", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteRefCommand(
            ExtensionProvider.getExtension()
          ).run();
          expect(link).toEqual("![[dendron://vault1/foo]]");
        });
      }
    );

    describeMultiWS(
      "no xvault link when disabled in config",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config: IntermediateDendronConfig) => {
          ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", false);
          return config;
        },
      },
      () => {
        test("THEN create xvault link", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const notePath = path.join(
            vault2Path({ vault: vaults[0], wsRoot }),
            "foo.md"
          );
          await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
          const link = await new CopyNoteRefCommand(
            ExtensionProvider.getExtension()
          ).run();
          expect(link).toEqual("![[foo]]");
        });
      }
    );

    describeMultiWS(
      "AND WHEN reference entire note",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        timeout: 5e3,
      },
      () => {
        test("THEN generate note to note", async () => {
          const engine = ExtensionProvider.getEngine();
          const note = (await engine.getNoteMeta("foo")).data!;
          await WSUtils.openNote(note);
          const link = await new CopyNoteRefCommand(
            ExtensionProvider.getExtension()
          ).run();
          expect(link).toEqual("![[foo]]");
        });
      }
    );

    describe("AND WHEN reference with config", () => {
      describeMultiWS(
        "AND WHEN with header selected",
        {
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
        },
        () => {
          test("THEN generate note ref", async () => {
            const engine = ExtensionProvider.getEngine();
            const note = (await engine.getNoteMeta("bar")).data!;
            const editor = await WSUtils.openNote(note);
            editor.selection = new vscode.Selection(7, 0, 7, 12);
            const link = await new CopyNoteRefCommand(
              ExtensionProvider.getExtension()
            ).run();
            expect(link).toEqual("![[bar#foo]]");
          });
        }
      );
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
});
