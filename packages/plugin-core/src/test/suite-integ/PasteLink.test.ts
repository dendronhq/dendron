import { NotePropsV2 } from "@dendronhq/common-all";
import { DirResult, tmpDir } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { PasteLinkCommand } from "../../commands/PasteLink";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";
import { expect, LocationTestUtils, runMultiVaultTest } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";
import clipboardy from "@dendronhq/clipboardy";
suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
  });

  suite("notes", function () {
    let root: DirResult;
    let ctx: vscode.ExtensionContext;
    let vaultPath: string;
    this.timeout(TIMEOUT);

    ctx = setupBeforeAfter(this, {
      beforeHook: () => {
        root = tmpDir();
      },
    });

    test("basic", (done) => {
      onWSInit(async () => {
        const notePath = path.join(vaultPath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = "https://stackoverflow.com/questions/tagged/jest";

        try {
          clipboardy.writeSync(link);
        } catch (err) {
          throw err;
        }
        const metaData = await new PasteLinkCommand().run();

        assert.strictEqual(
          metaData,
          "[Newest 'jest' Questions](https://stackoverflow.com/questions/tagged/jest)"
        );
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });
    test("basic2", (done) => {
      onWSInit(async () => {
        const notePath = path.join(vaultPath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = "https://en.wikipedia.org/wiki/Computer_programming";

        try {
          clipboardy.writeSync(link);
        } catch (err) {
          throw err;
        }
        const metaData = await new PasteLinkCommand().run();

        assert.strictEqual(
          metaData,
          "[Computer programming - Wikipedia](https://en.wikipedia.org/wiki/Computer_programming)"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });
    test("advanced", (done) => {
      onWSInit(async () => {
        const notePath = path.join(vaultPath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = "https://www.npmjs.com/package/open-graph-scraper";

        try {
          clipboardy.writeSync(link);
        } catch (err) {
          throw err;
        }
        const metaData = await new PasteLinkCommand().run();

        const ogs = require("open-graph-scraper");
        const options = { url: link };
        ogs(options).then((data) => {
          const { error, result, response } = data;
          const { ogUrl, ogSiteName, ogTitle, ogDescription, ogImage } = result;
          const actualMetaData = `[${ogTitle}](${ogUrl})`;
          assert.strictEqual(metaData, actualMetaData);
          done();
        });
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });

    test("error", (done) => {
      onWSInit(async () => {
        const notePath = path.join(vaultPath, "foo.md");
        await VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const link = "askdjabsasdas";

        try {
          clipboardy.writeSync(link);
        } catch (err) {
          throw err;
        }
        const metaData = await new PasteLinkCommand().run();

        assert.strictEqual(metaData, "error");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultDir) => {
          vaultPath = vaultDir;
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
        },
      });
    });
  });
});
