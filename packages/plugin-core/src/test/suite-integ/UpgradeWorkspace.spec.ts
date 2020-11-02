import {
  DirResult,
  FileTestUtils,
  readJSONWithComments,
} from "@dendronhq/common-server";
import * as assert from "assert";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, it } from "mocha";
import path from "path";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";
import { WORKSPACE_STATE } from "../../constants";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { Snippets } from "../../settings";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onWSInit, setupWorkspace } from "../testUtils";

const TIMEOUT = 60 * 1000 * 5;

suite("upgrade", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let root: DirResult;

  describe("main", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      await new ResetConfigCommand().execute({ scope: "all" });
      root = FileTestUtils.tmpDir();
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    it("setting with extra prop", function (done) {
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
  });
});
