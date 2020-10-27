import {
  DirResult,
  FileTestUtils,
  NodeTestUtils,
  readJSONWithComments,
} from "@dendronhq/common-server";
import * as assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach, describe, it } from "mocha";
import { ExtensionContext, WorkspaceFolder } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";
import { WORKSPACE_STATE } from "../../constants";
import { _activate } from "../../_extension";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import {
  onExtension,
  onWSInit,
  setupDendronWorkspace,
  setupWorkspace,
} from "../testUtils";
import path from "path";
import { Snippets } from "../../settings";
import fs from "fs-extra";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";

const TIMEOUT = 60 * 1000 * 5;

suite("startup", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let root: DirResult;

  describe("workspace", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      await new ResetConfigCommand().execute({ scope: "all" });
      root = FileTestUtils.tmpDir();
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    it("workspace active, prior workspace version", function (done) {
      const pathToVault = path.join(root.name, "vault");
      const snippetFile = path.join(pathToVault, ".vscode", Snippets.filename);

      onWSInit(async (_event: HistoryEvent) => {
        assert.strictEqual(DendronWorkspace.isActive(), true);
        assert.strictEqual(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
          "0.0.1"
        );
        const payload = await readJSONWithComments(snippetFile);
        assert.deepStrictEqual(payload, {
          bond: {
            prefix: "bond",
            desc: "diff_prefix",
          },
          time: {
            prefix: "snippet_with_same_id",
          },
          snippet_with_same_prefix: {
            prefix: "date",
          },
          todo: {
            prefix: "to",
            scope: "markdown,yaml",
            body: "- [ ] ",
            description: "render todo box",
          },
          tag: {
            prefix: "#",
            scope: "markdown,yaml",
            body: "[[#${1:my-tag}|tag.${1}]]",
            description: "tag",
          },
        });
        done();
      });

      setupWorkspace(root.name);

      DendronWorkspace.version = () => "0.0.1";
      assert.strictEqual(
        ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
        undefined
      );
      ctx.globalState.update(WORKSPACE_STATE.WS_VERSION, "0.0.1").then(() => {
        // setup workspace
        new SetupWorkspaceCommand()
          .execute({
            rootDirRaw: root.name,
            skipOpenWs: true,
            skipConfirmation: true,
            emptyWs: true,
          })
          .then(async () => {
            fs.ensureFileSync(snippetFile);
            fs.writeJSONSync(snippetFile, {
              bond: {
                prefix: "bond",
                desc: "diff_prefix",
              },
              time: {
                prefix: "snippet_with_same_id",
              },
              snippet_with_same_prefix: {
                prefix: "date",
              },
            });
            _activate(ctx);
          });
      });
    });

    it("workspace active, no prior workspace version", function (done) {
      setupWorkspace(root.name);
      onWSInit((_event: HistoryEvent) => {
        assert.strictEqual(DendronWorkspace.isActive(), true);
        assert.strictEqual(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
          "0.0.1"
        );
        const engine = DendronWorkspace.instance().engine;
        assert.strictEqual(_.values(engine.notes).length, 2);
        assert.strictEqual(engine.notes["id.foo"].fname, "foo");
        const pathToVault = DendronWorkspace.rootWorkspaceFolder()?.uri
          .fsPath as string;
        const snippetFile = path.join(
          pathToVault,
          ".vscode",
          Snippets.filename
        );
        const payload = fs.readJSONSync(snippetFile);
        assert.deepStrictEqual(payload, Snippets.defaults);
        done();
      });

      DendronWorkspace.version = () => "0.0.1";
      assert.strictEqual(
        ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
        undefined
      );

      // setup workspace
      new SetupWorkspaceCommand()
        .execute({
          rootDirRaw: root.name,
          skipOpenWs: true,
          skipConfirmation: true,
          emptyWs: true,
        })
        .then(async () => {
          const wsFolder = DendronWorkspace.workspaceFolders() as WorkspaceFolder[];
          NodeTestUtils.createNotes(wsFolder[0].uri.fsPath, [
            {
              id: "id.foo",
              fname: "foo",
            },
          ]);
          _activate(ctx);
        });
    });
  });
});

suite("startup with lsp", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let root: DirResult;
  let vaultPath: string;

  describe("workspace", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      await new ResetConfigCommand().execute({ scope: "all" });
      root = FileTestUtils.tmpDir();
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

    it("workspace active, no prior workspace version", function (done) {
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
  });
});
