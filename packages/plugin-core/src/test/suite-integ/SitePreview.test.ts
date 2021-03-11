import { describe, test } from "mocha";
import sinon from "sinon";
import { ExtensionContext, window } from "vscode";
import { checkPreReq } from "../../utils/site";
import { expect } from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

function stubWindow(returnValue: string) {
  // @ts-ignore
  sinon
    .stub(window, "showInformationMessage")
    .returns(Promise.resolve(returnValue));
}

suite("SitePreview", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
    afterHook: () => {},
  });

  describe("checkPreReq", function () {
    test("cancel", function (done) {
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async () => {
          stubWindow("Cancel");
          const resp = await checkPreReq();
          expect(resp).toEqual("cancel");
          done();
        },
      });
    });
  });
});
