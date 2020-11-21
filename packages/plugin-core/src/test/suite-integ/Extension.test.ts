import { tmpDir } from "@dendronhq/common-server";
import { beforeEach, describe, it } from "mocha";
import vscode, { ExtensionContext } from "vscode";
import {
  InitializeType,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import { stubSetupWorkspace } from "./SetupWorkspace.test";

const TIMEOUT = 60 * 1000 * 5;

suite("Extension", function () {
  let ctx: ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(async function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
    await resetCodeWorkspace();
  });

  describe("basics", function () {
    it("not active", function (done) {
      _activate(ctx).then((resp) => {
        expect(resp).toBeFalsy();
        done();
      });
    });

    it("not active/ init", function (done) {
      const wsRoot = tmpDir().name;
      _activate(ctx).then(async (resp) => {
        expect(resp).toBeFalsy();
        stubSetupWorkspace({ wsRoot, initType: InitializeType.EMPTY });
        await vscode.commands.executeCommand(DENDRON_COMMANDS.INIT_WS.key, {
          skipOpenWs: true,
          skipConfirmation: true,
        } as SetupWorkspaceOpts);
        done();
      });
    });
  });
});
