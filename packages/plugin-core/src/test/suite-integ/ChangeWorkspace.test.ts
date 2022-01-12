import {
  describeMultiWS,
  setupBeforeAfter,
  setupLegacyWorkspaceMulti,
} from "../testUtilsV3";
import { describe, before, beforeEach, after, afterEach } from "mocha";
import { ChangeWorkspaceCommand } from "../../commands/ChangeWorkspace";
import sinon from "sinon";
import { window } from "vscode";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WorkspaceType } from "@dendronhq/common-all";
import { expect } from "../testUtilsv2";
import { getDWorkspace } from "../../workspace";

// eslint-disable-next-line prefer-arrow-callback
suite("GIVEN ChangeWorkspace command", function () {
  const ctx = setupBeforeAfter(this, {});

  describeMultiWS(
    "WHEN command is gathering inputs",
    {
      ctx,
    },
    () => {
      let showOpenDialog: sinon.SinonStub;

      beforeEach(async () => {
        const cmd = new ChangeWorkspaceCommand();
        showOpenDialog = sinon.stub(window, "showOpenDialog");
        await cmd.gatherInputs();
      });
      afterEach(() => {
        showOpenDialog.restore();
      });

      test("THEN file picker is opened", (done) => {
        expect(showOpenDialog.calledOnce).toBeFalsy();
        done();
      });
    }
  );

  describeMultiWS(
    "WHEN command is run",
    {
      ctx,
    },
    () => {
      describe("AND a code workspace is selected", () => {
        let openWS: sinon.SinonStub;
        let newWSRoot: string;
        before(async () => {
          const { wsRoot: currentWSRoot } = getDWorkspace();
          openWS = sinon.stub(VSCodeUtils, "openWS").resolves();

          const out = await setupLegacyWorkspaceMulti({
            ctx,
            workspaceType: WorkspaceType.CODE,
          });
          newWSRoot = out.wsRoot;
          expect(newWSRoot).toNotEqual(currentWSRoot);

          const cmd = new ChangeWorkspaceCommand();
          sinon.stub(cmd, "gatherInputs").resolves({ rootDirRaw: newWSRoot });
          await cmd.run();
        });
        after(() => {
          openWS.restore();
        });

        test("THEN workspace is opened", (done) => {
          expect(openWS.calledOnce).toBeTruthy();
          expect(openWS.calledOnceWithExactly(newWSRoot));
          done();
        });
      });

      describe("AND a native workspace is selected", () => {
        let openWS: sinon.SinonStub;
        let newWSRoot: string;
        before(async () => {
          const { wsRoot: currentWSRoot } = getDWorkspace();
          openWS = sinon.stub(VSCodeUtils, "openWS").resolves();

          const out = await setupLegacyWorkspaceMulti({
            ctx,
            workspaceType: WorkspaceType.NATIVE,
          });
          newWSRoot = out.wsRoot;
          expect(newWSRoot).toNotEqual(currentWSRoot);

          const cmd = new ChangeWorkspaceCommand();
          sinon.stub(cmd, "gatherInputs").resolves({ rootDirRaw: newWSRoot });
          await cmd.run();
        });
        after(() => {
          openWS.restore();
        });

        test("THEN workspace is opened", (done) => {
          expect(openWS.calledOnce).toBeTruthy();
          expect(openWS.calledOnceWithExactly(newWSRoot));
          done();
        });
      });
    }
  );
});
