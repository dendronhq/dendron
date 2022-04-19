import { ServerUtils } from "@dendronhq/api-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import sinon, { SinonStub } from "sinon";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("StartServer", function () {
  let homeDirStub: SinonStub;

  setupBeforeAfter(this, {
    beforeHook: async () => {
      sinon.restore();
      await resetCodeWorkspace();
      const ext = ExtensionProvider.getExtension();
      await new ResetConfigCommand(ext).execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
  });

  describe("basic", function () {
    test("ok", function (done) {
      const ext = ExtensionProvider.getExtension();
      ServerUtils.execServerNode({
        scriptPath: path.join(__dirname, "..", "..", "server.js"),
        logPath: ext.context.logPath,
      }).then(({ port }) => {
        expect(port > 0).toBeTruthy();
        done();
      });
    });
  });
});
