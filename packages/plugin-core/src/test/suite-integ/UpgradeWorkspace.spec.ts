import * as assert from "assert";
import _ from "lodash";
import { describe, it } from "mocha";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onExtension } from "../testUtils";
import { setupCodeWorkspaceV2 } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

const TIMEOUT = 60 * 1000 * 5;
const exepctedUpgradeSettings = () => {
  return {
    extensions: {},
    settings: {
      add: {
        "dendron.rootDir": ".",
        "editor.minimap.enabled": false,
        "files.autoSave": "onFocusChange",
        "pasteImage.path": "${currentFileDir}/assets/images",
        "pasteImage.prefix": "/",
        "markdown-preview-enhanced.enableWikiLinkSyntax": true,
        "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
        "vscodeMarkdownNotes.noteCompletionConvention": "noExtension",
        "vscodeMarkdownNotes.slugifyCharacter": "NONE",
        "editor.snippetSuggestions": "inline",
        "editor.suggest.snippetsPreventQuickSuggestions": false,
        "editor.suggest.showSnippets": true,
        "editor.tabCompletion": "on",
      },
      errors: {},
    },
    snippetChanges: {},
  };
};

/**
 * NOTE: upgrade hard to test because we can't write to file
 * without ACTUALLY initializing in a workspace
 *
 * TODO: test that setting a custom prop won't be overridden
 */
suite("upgrade", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;

  describe("main", function () {
    ctx = setupBeforeAfter(this, {
      beforeHook: async () => {
        await new ResetConfigCommand().execute({ scope: "all" });
      },
    });

    it("basic", function (done) {
      onExtension({
        action: "upgraded",
        cb: async (ev: { data: any }) => {
          assert.deepStrictEqual(
            ev.data.changes.configUpdate,
            exepctedUpgradeSettings()
          );
          done();
        },
      });

      const run = async () => {
        // not upgrading from scratch
        DendronWorkspace.version = () => "0.0.1";
        ({} = await setupCodeWorkspaceV2({
          ctx,
        }));
        await _activate(ctx);
      };
      run();
    });

    it("don't override current settings", function (done) {
      onExtension({
        action: "upgraded",
        cb: async (ev: { data: any }) => {
          const expected = _.omit(
            exepctedUpgradeSettings(),
            "pasteImage.prefix"
          );
          assert.deepStrictEqual(ev.data.changes.configUpdate, expected);
          const config = DendronWorkspace.configuration();
          assert.strictEqual(config.get<string>("pasteImage.prefix"), "/foo");
          done();
        },
      });

      const run = async () => {
        // not upgrading from scratch
        DendronWorkspace.version = () => "0.0.1";
        ({} = await setupCodeWorkspaceV2({
          ctx,
          configOverride: {
            "pasteImage.prefix": "/foo",
          },
        }));
        await _activate(ctx);
      };
      run();
    });
  });
});
