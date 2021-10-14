import { WorkspaceType } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { getDWorkspace } from "../../workspace";
import {
  describeMultiWS,
  runSuiteButSkipForWindows,
  setupBeforeAfter,
} from "../testUtilsV3";
import { _activate } from "../../_extension";
import { expect } from "../testUtilsv2";

runSuiteButSkipForWindows()(
  "GIVEN testing code setupLegacyWorkspaceMulti",
  function () {
    const ctx = setupBeforeAfter(this);

    describeMultiWS(
      "WHEN configured for NATIVE workspace",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ctx,
        workspaceType: WorkspaceType.NATIVE,
      },
      () => {
        test("THEN initializes correctly", (done) => {
          const { engine } = getDWorkspace();
          const testNote = engine.notes["foo"];
          expect(testNote).toBeTruthy();
          done();
        });

        test("THEN is of NATIVE type", (done) => {
          const { type } = getDWorkspace();
          expect(type).toEqual(WorkspaceType.NATIVE);
          done();
        });
      }
    );

    describeMultiWS(
      "WHEN configured for CODE workspace",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ctx,
        workspaceType: WorkspaceType.CODE,
      },
      () => {
        test("THEN initializes correctly", (done) => {
          const { engine } = getDWorkspace();
          const testNote = engine.notes["foo"];
          expect(testNote).toBeTruthy();
          done();
        });

        test("THEN is of CODE type", (done) => {
          const { type } = getDWorkspace();
          expect(type).toEqual(WorkspaceType.CODE);
          done();
        });
      }
    );

    describeMultiWS(
      "WHEN workspace type is not specified",
      {
        preSetupHook: ENGINE_HOOKS.setupBasic,
        ctx,
      },
      () => {
        test("THEN initializes correctly", (done) => {
          const { engine } = getDWorkspace();
          const testNote = engine.notes["foo"];
          expect(testNote).toBeTruthy();
          done();
        });

        test("THEN is of CODE type", (done) => {
          const { type } = getDWorkspace();
          expect(type).toEqual(WorkspaceType.CODE);
          done();
        });
      }
    );
  }
);
