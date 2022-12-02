import assert from "assert";
import _ from "lodash";
import { container } from "tsyringe";
import { URI } from "vscode-uri";
import { ExtensionProvider } from "../../ExtensionProvider";
import { setupLocalExtContainer } from "../../injection-providers/setupLocalExtContainer";
import { EngineAPIService } from "../../services/EngineAPIService";
import { NativeTreeView } from "../../views/common/treeview/NativeTreeView";
import { describeSingleWS } from "../testUtilsV3";
import * as vscode from "vscode";

/**
 * This test suite ensures that all objects in main (_extension.ts) can be
 * properly resolved by the DI container from `setupLocalExtContainer`
 */
suite(
  "GIVEN an injection container for the Dendron Local Extension configuration",
  () => {
    describeSingleWS(
      "WHEN NativeTreeView is constructed ",
      { timeout: 1e6 },
      () => {
        test("THEN valid objects are returned without exceptions", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
          const config = await ws.config;
          const engine = ExtensionProvider.getEngine() as EngineAPIService;
          setupLocalExtContainer({
            wsRoot,
            vaults,
            engine,
            config,
            context: {
              extensionUri: URI.parse("dummy"),
              subscriptions: [] as vscode.Disposable[],
            } as vscode.ExtensionContext,
          });
          try {
            const obj = container.resolve(NativeTreeView);
            assert(!_.isUndefined(obj));
          } catch (error) {
            assert.fail(error as Error);
          }
        });
      }
    );
  }
);
