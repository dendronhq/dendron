import {
  DirResult,
  FileTestUtils,
  NodeTestUtils,
} from "@dendronhq/common-server";
import * as assert from "assert";
import _ from "lodash";
import { afterEach, beforeEach, describe, it } from "mocha";
import { ExtensionContext, WorkspaceFolder } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";
import { WORKSPACE_STATE } from "../../constants";
import { _activate } from "../../extension";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupWorkspace } from "../testUtils";

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

    it("workspace active, no prior workspace version", function (done) {
      setupWorkspace(root.name, { lsp: true });
      onWSInit(async (_event: HistoryEvent) => {
        assert.strictEqual(DendronWorkspace.isActive(), true);
        assert.strictEqual(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
          "0.0.1"
        );
        const engine = DendronWorkspace.instance().getEngine();
        assert.strictEqual(_.values(engine.notes).length, 2);
        assert.strictEqual(engine.notes["id.foo"].fname, "foo");
        assert.strictEqual(engine.notes["root"].fname, "root");
        done();
      });

      DendronWorkspace.version = () => "0.0.1";
      assert.strictEqual(
        ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
        undefined
      );
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
