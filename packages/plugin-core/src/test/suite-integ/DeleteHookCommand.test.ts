import { DConfig, HookUtils } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { CreateHookCommand } from "../../commands/CreateHookCommand";
import { DeleteHookCommand } from "../../commands/DeleteHookCommand";
import { DENDRON_COMMANDS } from "../../constants";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite(DENDRON_COMMANDS.DELETE_HOOK.key, function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this);
  describe("main", () => {
    test("basic", (done) => {
      const hookName = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          await new CreateHookCommand().execute({ hookFilter: "*", hookName });
          await new DeleteHookCommand().execute({
            hookName,
            shouldDeleteScript: true,
          });
          const config = DConfig.getOrCreate(wsRoot);
          expect(config.hooks).toEqual({
            onCreate: [],
          });

          expect(
            fs.existsSync(
              path.join(
                HookUtils.getHookScriptPath({
                  basename: `${hookName}.js`,
                  wsRoot,
                })
              )
            )
          ).toBeFalsy();
          done();
        },
      });
    });

    test("no delete", (done) => {
      const hookName = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          await new CreateHookCommand().execute({ hookFilter: "*", hookName });
          await new DeleteHookCommand().execute({
            hookName,
            shouldDeleteScript: false,
          });
          const config = DConfig.getOrCreate(wsRoot);
          expect(config.hooks).toEqual({
            onCreate: [],
          });

          expect(
            fs.existsSync(
              path.join(
                HookUtils.getHookScriptPath({
                  basename: `${hookName}.js`,
                  wsRoot,
                })
              )
            )
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
