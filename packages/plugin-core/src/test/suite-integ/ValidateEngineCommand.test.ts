import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { describeSingleWS } from "../testUtilsV3";
import { expect } from "../testUtilsv2";
import { ValidateEngineCommand } from "../../commands/ValidateEngineCommand";
import sinon from "sinon";
import { ExtensionProvider } from "../../ExtensionProvider";

suite("ValidateEngineCommand tests", function () {
  describeSingleWS(
    "GIVEN a workspace with no issues",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN command detects no issues", async () => {
        const windowSpy = sinon.spy(vscode.window, "showErrorMessage");
        await new ValidateEngineCommand().execute();
        expect(windowSpy.callCount).toEqual(0);

        windowSpy.restore();
      });
    }
  );

  describeSingleWS(
    "GIVEN a workspace with engine child/parent issues",
    {
      postSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN command shows error message", async () => {
        const windowSpy = sinon.spy(vscode.window, "showErrorMessage");
        const { engine } = ExtensionProvider.getDWorkspace();

        // Purposely remove children from foo note
        const foo = (await engine.getNote("foo")).data!;
        foo.children = [];
        await engine.writeNote(foo, { metaOnly: true });
        await new ValidateEngineCommand().execute();
        expect(windowSpy.callCount).toEqual(1);
        const errorMsg = windowSpy.getCall(0).args[0];
        expect(errorMsg.includes("Mismatch at foo's children")).toBeTruthy();

        windowSpy.restore();
      });
    }
  );
});
