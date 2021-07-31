import { IDendronError } from "@dendronhq/common-all";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { DConfig, HookUtils } from "@dendronhq/engine-server";
import { ENGINE_HOOKS, TestHookUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { CreateHookCommand } from "../../commands/CreateHookCommand";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite(DENDRON_COMMANDS.CREATE_HOOK.key, function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);
  describe("main", () => {
    test("basic", (done) => {
      const hook = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          const stub = sinon.stub(VSCodeUtils, "showInputBox");

          stub.onCall(0).returns(Promise.resolve(hook));
          stub.onCall(1).returns(Promise.resolve("*"));

          await new CreateHookCommand().run();
          const editor = VSCodeUtils.getActiveTextEditorOrThrow();
          const config = DConfig.getOrCreate(wsRoot);
          expect(config.hooks).toEqual({
            onCreate: [{ id: hook, pattern: "*", type: "js" }],
          });
          expect(editor.document.uri.fsPath.toLowerCase()).toEqual(
            path.join(
              HookUtils.getHookScriptPath({ basename: `${hook}.js`, wsRoot })
            ).toLowerCase()
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
