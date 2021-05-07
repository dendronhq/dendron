import { AssertUtils, ENGINE_HOOKS } from "@dendronhq/common-test-utils";
import { TestHookUtils } from "@dendronhq/engine-test-utils";
import { HookUtils } from "@dendronhq/engine-server";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { CreateHookCommand } from "../../commands/CreateHookCommand";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { IDendronError } from "@dendronhq/common-all";

suite(CreateHookCommand.key, function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });
  describe("main", () => {
    test("basic", (done) => {
      const hook = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          sinon
            .stub(VSCodeUtils, "showInputBox")
            .returns(Promise.resolve(hook));
          await new CreateHookCommand().run();
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          expect(editor.document.uri.fsPath).toEqual(
            path.join(
              HookUtils.getHookScriptPath({ basename: `${hook}.js`, wsRoot })
            )
          );
          expect(
            AssertUtils.assertInString({
              body: editor.document.getText(),
              match: ["module.export"],
            })
          ).toBeTruthy();
          done();
        },
      });
    });

    test("overwrite existing file", (done) => {
      const hook = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          TestHookUtils.writeJSHook({
            wsRoot: opts.wsRoot,
            fname: hook,
            canary: "hook",
          });
        },
        onInit: async ({}) => {
          sinon
            .stub(VSCodeUtils, "showInputBox")
            .returns(Promise.resolve(hook));
          const { error } = (await new CreateHookCommand().run()) as {
            error: IDendronError;
          };
          expect(error.message.endsWith("exists")).toBeTruthy();
          done();
        },
      });
    });
  });
});
