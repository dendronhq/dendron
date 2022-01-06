import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";
import { beforeEach, afterEach } from "mocha";
import sinon from "sinon";
import { window } from "vscode";
import { expect } from "../testUtilsv2";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";

// eslint-disable-next-line prefer-arrow-callback
suite("GIVEN SetupWorkspace command", function () {
  const ctx = setupBeforeAfter(this, {});

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
