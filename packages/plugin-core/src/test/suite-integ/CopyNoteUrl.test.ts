import { ENGINE_HOOKS, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { CopyNoteURLCommand } from "../../commands/CopyNoteURL";
import { CONFIG } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

suite("CopyNoteUrl", function () {
  let ctx: vscode.ExtensionContext;
  let rootUrl = "dendron.so";

  ctx = setupBeforeAfter(this, {});

  test("with override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = "foo";
        await VSCodeUtils.openNoteByPath({ vault, fname });
        const link = await new CopyNoteURLCommand().run();
        const url = path.join(rootUrl, "notes", "foo.html");
        expect(url).toEqual(link);
        done();
      },
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
    });
  });

  test("with config override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot }) => {
        withConfig(
          (config) => {
            config.site.siteUrl = "https://example.com";
            return config;
          },
          { wsRoot }
        );
        const fname = "foo";
        const url = _.join(
          ["https://example.com", "notes", `${fname}.html`],
          "/"
        );
        const link = await new CopyNoteURLCommand().run();
        expect(url).toEqual(link);
        done();
      },
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
    });
  });

  test("with selection and override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        const { vaults, wsRoot } = opts;
        const vault = vaults[0];
        await ENGINE_HOOKS.setupBasic(opts),
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
            wsRoot,
            vault,
          });
      },
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.fname;
        const editor = await VSCodeUtils.openNoteByPath({ vault, fname });
        editor.selection = new vscode.Selection(7, 0, 7, 12);
        const link = await new CopyNoteURLCommand().run();
        const url = path.join(rootUrl, "notes", `${fname}.html#h1`);
        expect(url).toEqual(link);
        done();
      },
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
    });
  });
});
