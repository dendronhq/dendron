import { ConfigUtils, DendronConfig } from "@dendronhq/common-all";
import { NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { describe, test } from "mocha";
import * as vscode from "vscode";
import { CopyNoteURLCommand } from "../../commands/CopyNoteURL";
import { ExtensionProvider } from "../../ExtensionProvider";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

const ROOT_URL = "https://dendron.so";
const ASSET_PREFIX = "aprefix";
function setupConfig(config: DendronConfig) {
  config = ConfigUtils.genDefaultConfig();
  config.publishing.siteUrl = ROOT_URL;
  return config;
}

suite("GIVEN CopyNoteUrlV2", function () {
  const modConfigCb = setupConfig;
  describe("AND WHEN has selection", () => {
    describeMultiWS(
      "WHEN selection with block anchor",
      {
        modConfigCb,
        timeout: 4e3,
        postSetupHook: async (opts) => {
          const { vaults, wsRoot } = opts;
          const vault = vaults[0];
          await ENGINE_HOOKS.setupBasic(opts);
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault,
          });
        },
      },
      () => {
        test("THEN create link with block anchor", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const vault = vaults[0];
          const fname = NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.fname;
          const editor = await WSUtils.openNoteByPath({ vault, fname });
          editor.selection = new vscode.Selection(10, 0, 10, 5);
          const link = await new CopyNoteURLCommand(
            ExtensionProvider.getExtension()
          ).execute();
          const url = [ROOT_URL, "notes", `${fname}#^block-id`].join("/");
          expect(link).toEqual(url);
        });
      }
    );

    describeMultiWS(
      "WHEN selection with header anchor",
      {
        modConfigCb,
        timeout: 4e3,
        postSetupHook: async (opts) => {
          const { vaults, wsRoot } = opts;
          const vault = vaults[0];
          await ENGINE_HOOKS.setupBasic(opts);
          await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
            wsRoot,
            vault,
          });
        },
      },
      () => {
        test("THEN create link with header anchor", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const vault = vaults[0];
          const fname = NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.fname;
          const editor = await WSUtils.openNoteByPath({ vault, fname });
          editor.selection = new vscode.Selection(7, 0, 7, 12);
          const link = await new CopyNoteURLCommand(
            ExtensionProvider.getExtension()
          ).run();
          const url = [ROOT_URL, "notes", `${fname}#h1`].join("/");
          expect(link).toEqual(url);
        });
      }
    );
  });

  describe("AND WHEN regular copy", () => {
    describeMultiWS(
      "",
      {
        modConfigCb,
        timeout: 4e3,
        postSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
      },
      () => {
        test("THEN create regular link", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const vault = vaults[0];
          const fname = "foo";
          await WSUtils.openNoteByPath({ vault, fname });
          const link = await new CopyNoteURLCommand(
            ExtensionProvider.getExtension()
          ).execute();
          const url = _.join([ROOT_URL, "notes", `${fname}`], "/");
          expect(link).toEqual(url);
        });
      }
    );
  });

  describe("AND WHEN asset prefix set", () => {
    describeMultiWS(
      "",
      {
        timeout: 4e3,
        modConfigCb: (config) => {
          config = setupConfig(config);
          config.publishing.assetsPrefix = "/" + ASSET_PREFIX;
          return config;
        },
        postSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
      },
      () => {
        test("THEN create link with prefix", async () => {
          const vaults = await ExtensionProvider.getDWorkspace().vaults;
          const vault = vaults[0];
          const fname = "foo";
          await WSUtils.openNoteByPath({ vault, fname });
          const link = await new CopyNoteURLCommand(
            ExtensionProvider.getExtension()
          ).execute();
          const url = _.join(
            [ROOT_URL, ASSET_PREFIX, "notes", `${fname}`],
            "/"
          );
          expect(link).toEqual(url);
        });
      }
    );
  });
});
