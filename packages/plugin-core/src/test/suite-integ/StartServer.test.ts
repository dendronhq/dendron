import { ServerUtils } from "@dendronhq/api-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import sinon, { SinonStub } from "sinon";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("StartServer", function () {
  let homeDirStub: SinonStub;

  setupBeforeAfter(this, {
    beforeHook: async () => {
      sinon.restore();
      await resetCodeWorkspace();
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
  });

  describe("basic", function () {
    test("ok", function (done) {
      ServerUtils.execServerNode({
        scriptPath: path.join(__dirname, "..", "..", "server.js"),
        logPath: ExtensionProvider.getExtension().context.logPath,
      }).then(({ port }) => {
        expect(port > 0).toBeTruthy();
        done();
      });
    });
  });
});
