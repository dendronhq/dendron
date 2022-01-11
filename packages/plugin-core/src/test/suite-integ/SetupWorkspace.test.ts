import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { beforeEach, afterEach } from "mocha";
import sinon, { SinonStub } from "sinon";
import { ExtensionContext, window } from "vscode";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";

// eslint-disable-next-line prefer-arrow-callback
suite("GIVEN SetupWorkspace command", function () {
  let homeDirStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
  });

  describeMultiWS(
    "WHEN command is gathering inputs",
    {
      ctx,
    },
    () => {
      let showOpenDialog: sinon.SinonStub;

      beforeEach(async () => {
        const cmd = new SetupWorkspaceCommand();
        showOpenDialog = sinon.stub(window, "showOpenDialog");
        await cmd.gatherInputs();
      });
      afterEach(() => {
        showOpenDialog.restore();
      });

      test("THEN file picker is opened", (done) => {
        expect(showOpenDialog.calledOnce).toBeTruthy();
        done();
      });
    }
  );
});
