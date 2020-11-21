import { DendronConfig, DVault, Time } from "@dendronhq/common-all";
import { DirResult, readYAML, tmpDir } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import {
  DConfig,
  getPortFilePath,
  getWSMetaFilePath,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach, describe, it } from "mocha";
import path from "path";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  InitializeType,
  SetupWorkspaceCommand,
} from "../../commands/SetupWorkspace";
import { GLOBAL_STATE, WORKSPACE_STATE } from "../../constants";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { _activate } from "../../_extension";
import { onExtension, onWSInit, setupDendronWorkspace } from "../testUtils";
import {
  expect,
  genEmptyWSFiles,
  runWorkspaceTestV3,
  setupCodeWorkspaceV2,
  stubWorkspace,
} from "../testUtilsv2";

const TIMEOUT = 60 * 1000 * 5;

export function stubSetupWorkspace({
  wsRoot,
  initType,
}: {
  wsRoot: string;
  initType: InitializeType;
}) {
  // @ts-ignore
  VSCodeUtils.gatherFolderPath = () => {
    return wsRoot;
  };
  switch (initType) {
    case InitializeType.EMPTY:
      // @ts-ignore
      VSCodeUtils.showQuickPick = () => {
        return "initialize empty repository";
      };
      break;
    default:
      throw Error(`inittype ${initType} not handled`);
  }
}

suite("SetupWorkspace", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let root: DirResult;
  let vaultPath: string;

  describe("workspace", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      await new ResetConfigCommand().execute({ scope: "all" });
      root = tmpDir();
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    // update test for partial failure
    it.skip("workspace active, bad schema", function (done) {
      onExtension({
        action: "not_initialized",
        cb: async (_event: HistoryEvent) => {
          const client = DendronWorkspace.instance().getEngine();
          assert.deepStrictEqual(client.notes, {});
          done();
        },
      });

      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (vaultPath) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
          fs.writeFileSync(
            path.join(vaultPath, "bond.schema.yml"),
            `
id: bond
`
          );
        },
      });
    });

    it("upgrade config", function (done) {
      DendronWorkspace.version = () => "0.0.1";
      setupCodeWorkspaceV2({
        ctx,
        postSetupHook: async ({ wsRoot }) => {
          fs.removeSync(DConfig.configPath(wsRoot));
          await DConfig.getOrCreate(wsRoot);
        },
      }).then(({ vaults }) => {
        onExtension({
          action: "activate",
          cb: async (_event: HistoryEvent) => {
            assert.strictEqual(DendronWorkspace.isActive(), true);
            assert.strictEqual(
              ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
              "0.0.1"
            );
            const engine = DendronWorkspace.instance().getEngine();
            const wsRoot = DendronWorkspace.wsRoot() as string;
            // check for config file
            const config = readYAML(
              DConfig.configPath(wsRoot)
            ) as DendronConfig;

            // cehck that config was upgraded using relative file
            assert.deepStrictEqual(config.vaults, [
              { fsPath: path.basename(vaults[0]) },
            ]);

            // check for meta
            const port = getPortFilePath({ wsRoot });
            const fpath = getWSMetaFilePath({ wsRoot });
            const meta = openWSMetaFile({ fpath });
            assert.ok(
              _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
            );
            assert.strictEqual(meta.version, "0.0.1");
            assert.ok(meta.activationTime < Time.now().toMillis());
            assert.strictEqual(_.values(engine.notes).length, 1);
            assert.deepStrictEqual(fs.readdirSync(vaults[0]).sort(), [
              ".git",
              ".vscode",
              "assets",
              "root.md",
              "root.schema.yml",
            ]);
            done();
          },
        });
        _activate(ctx);
      });
    });

    it("workspace active, no prior workspace version", function (done) {
      runWorkspaceTestV3({
        ctx,
        preActivateHook: () => {
          DendronWorkspace.version = () => "0.0.1";
        },
        onInit: async ({ wsRoot, vaults, engine }) => {
          assert.strictEqual(DendronWorkspace.isActive(), true);
          assert.strictEqual(
            ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
            "0.0.1"
          );
          // check config
          const config = readYAML(DConfig.configPath(wsRoot)) as DendronConfig;
          assert.deepStrictEqual(config.vaults, vaults);

          // check for meta
          const port = getPortFilePath({ wsRoot });
          const fpath = getWSMetaFilePath({ wsRoot });
          const meta = openWSMetaFile({ fpath });
          assert.ok(
            _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
          );
          assert.strictEqual(meta.version, "0.0.1");
          assert.ok(meta.activationTime < Time.now().toMillis());

          // check settings
          const payload = fs.readJSONSync(
            path.join(wsRoot, "dendron.code-workspace")
          );
          expect(payload).toEqual({
            extensions: {
              recommendations: [
                "dendron.dendron-paste-image",
                "equinusocio.vsc-material-theme",
                "dendron.dendron-markdown-shortcuts",
                "dendron.dendron-markdown-preview-enhanced",
                "dendron.dendron-markdown-links",
                "github.github-vscode-theme",
              ],
              unwantedRecommendations: [
                "dendron.dendron-markdown-notes",
                "shd101wyy.markdown-preview-enhanced",
                "kortina.vscode-markdown-notes",
                "mushan.vscode-paste-image",
              ],
            },
            folders: [
              {
                path: "vault",
              },
            ],
            settings: {
              "dendron.rootDir": ".",
              "editor.snippetSuggestions": "inline",
              "editor.suggest.showSnippets": true,
              "editor.suggest.snippetsPreventQuickSuggestions": false,
              "editor.tabCompletion": "on",
              "files.autoSave": "onFocusChange",
              "markdown-preview-enhanced.enableWikiLinkSyntax": true,
              "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
              "pasteImage.path": "${currentFileDir}/assets/images",
              "pasteImage.prefix": "/",
            },
          });

          // check for notes
          assert.deepStrictEqual(
            fs.readdirSync(DendronWorkspace.instance().vaults[0].fsPath).sort(),
            [".vscode", "root.md", "root.schema.yml"]
          );
          assert.strictEqual(_.values(engine.notes).length, 1);
          done();
        },
      });
    });

    it("missing root.schema", function (done) {
      onWSInit(async (_event: HistoryEvent) => {
        assert.strictEqual(DendronWorkspace.isActive(), true);
        assert.strictEqual(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
          "0.0.1"
        );
        const engine = DendronWorkspace.instance().getEngine();
        assert.strictEqual(_.values(engine.notes).length, 1);
        // assert.strictEqual(engine.notes["id.foo"].fname, "foo");
        // assert.strictEqual(engine.notes["root"].fname, "root");
        assert.deepStrictEqual(fs.readdirSync(vaultPath).sort(), [
          ".vscode",
          "root.md",
          "root.schema.yml",
        ]);
        done();
      });

      DendronWorkspace.version = () => "0.0.1";
      setupDendronWorkspace(root.name, ctx, {
        lsp: true,
        useCb: async (_vaultPath) => {
          vaultPath = _vaultPath;
          fs.removeSync(path.join(_vaultPath, "root.schema.yml"));
        },
      });
    });

    it.skip("with template", function (done) {
      runWorkspaceTestV3({
        ctx,
        setupWsOverride: {
          skipConfirmation: true,
          emptyWs: false,
          initType: InitializeType.TEMPLATE,
          skipOpenWs: true,
        },
        onInit: async ({ wsRoot }) => {
          const dendronRoot = path.join(wsRoot);
          expect(fs.existsSync(dendronRoot)).toEqual(true);
          done();
        },
      });
    });

    // new style
    it("first setup", function (done) {
      const wsRoot = tmpDir().name;
      stubWorkspace({ wsRoot, vaults: [] });
      // @ts-ignore
      VSCodeUtils.gatherFolderPath = () => {
        return wsRoot;
      };
      new SetupWorkspaceCommand()
        .run({ skipConfirmation: true, skipOpenWs: true })
        .then((vaults) => {
          let _vaults = vaults as DVault[];
          expect(_vaults.map((v) => v.fsPath)).toEqual(
            vaults?.map((ent) => ent.fsPath)
          );
          expect(fs.readdirSync(getWS().vaults[0].fsPath)).toEqual([
            ".vscode",
            "dendron.md",
            "dendron.welcome.md",
            "root.md",
            "root.schema.yml",
          ]);
          done();
        });
    });

    it("not first setup, choose empty", function (done) {
      const wsRoot = tmpDir().name;
      stubWorkspace({ wsRoot, vaults: [] });

      // @ts-ignore
      VSCodeUtils.gatherFolderPath = () => {
        return wsRoot;
      };
      // @ts-ignore
      VSCodeUtils.showQuickPick = () => {
        return "initialize empty repository";
      };

      getWS()
        .context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, false)
        .then(() => {
          new SetupWorkspaceCommand()
            .run({ skipConfirmation: true, skipOpenWs: true, emptyWs: true })
            .then((vaults) => {
              let _vaults = vaults as DVault[];
              expect(_vaults.map((v) => v.fsPath)).toEqual(
                vaults?.map((ent) => ent.fsPath)
              );
              expect(fs.readdirSync(getWS().vaults[0].fsPath)).toEqual(
                genEmptyWSFiles()
              );
              done();
            });
        });
    });
  });
});
