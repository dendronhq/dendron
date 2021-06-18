import { VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4, NOTE_PRESETS_V4 } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS, TestSeedUtils } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { CopyNoteURLCommand } from "../../commands/CopyNoteURL";
import { CONFIG } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { getWS } from "../../workspace";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

suite("CopyNoteUrl", function () {
  let ctx: vscode.ExtensionContext;
  let rootUrl = "dendron.so";

  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

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
      onInit: async ({ wsRoot, engine }) => {
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
        await VSCodeUtils.openNote(engine.notes["foo"]);
        const link = await new CopyNoteURLCommand().run();
        expect(url).toEqual(link);
        done();
      },
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
    });
  });

  test("with seed site url override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, engine, vaults }) => {
        await TestSeedUtils.addSeed2WS({
          wsRoot,
          engine,
          modifySeed: (seed) => {
            seed.site = {
              url: "https://foo.com",
            };
            return seed;
          },
        });
        const seedId = TestSeedUtils.defaultSeedId();
        engine.config = getWS().config;
        engine.vaults = engine.config.vaults;
        getWS().setEngine(engine);
        // TODO: ugly temporary hack. can be removed when [[Unify Runenginetest and Runworkspacetest|scratch.2021.06.17.164102.unify-runenginetest-and-runworkspacetest]] is implemented
        sinon.stub(VSCodeUtils, "getNoteFromDocument").returns(
          await NoteTestUtilsV4.createNote({
            fname: "root",
            vault: vaults[0],
            wsRoot,
          })
        );
        const vault = VaultUtils.getVaultByName({
          vaults: getWS().config.vaults,
          vname: seedId,
        })!;
        await VSCodeUtils.openNoteByPath({ vault, fname: "root" });
        const link = await new CopyNoteURLCommand().run();
        expect("https://foo.com").toEqual(link);
        done();
      },
    });
  });

  test("with seed site url and index override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, engine, vaults }) => {
        await TestSeedUtils.addSeed2WS({
          wsRoot,
          engine,
          modifySeed: (seed) => {
            seed.site = {
              url: "https://foo.com",
              index: "foo",
            };
            return seed;
          },
        });
        const seedId = TestSeedUtils.defaultSeedId();
        engine.config = getWS().config;
        engine.vaults = engine.config.vaults;
        getWS().setEngine(engine);
        // TODO: ugly temporary hack. can be removed when [[Unify Runenginetest and Runworkspacetest|scratch.2021.06.17.164102.unify-runenginetest-and-runworkspacetest]] is implemented
        sinon.stub(VSCodeUtils, "getNoteFromDocument").returns(
          await NoteTestUtilsV4.createNote({
            fname: "foo",
            vault: vaults[0],
            wsRoot,
          })
        );
        const vault = VaultUtils.getVaultByName({
          vaults: getWS().config.vaults,
          vname: seedId,
        })!;
        await VSCodeUtils.openNoteByPath({ vault, fname: "root" });
        const link = await new CopyNoteURLCommand().run();
        expect("https://foo.com").toEqual(link);
        done();
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

  test("with block anchor selection and override", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        const { vaults, wsRoot } = opts;
        const vault = vaults[0];
        await ENGINE_HOOKS.setupBasic(opts),
          await NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
            wsRoot,
            vault,
          });
      },
      onInit: async ({ vaults }) => {
        const vault = vaults[0];
        const fname = NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.fname;
        const editor = await VSCodeUtils.openNoteByPath({ vault, fname });
        editor.selection = new vscode.Selection(10, 0, 10, 5);
        const link = await new CopyNoteURLCommand().execute();
        const url = path.join(rootUrl, "notes", `${fname}.html#^block-id`);
        expect(url).toEqual(link);
        done();
      },
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: rootUrl,
      },
    });
  });
});
