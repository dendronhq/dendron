import assert from "assert";
import _ from "lodash";
import { container } from "tsyringe";
import { ExtensionProvider } from "../../ExtensionProvider";
import { setupLocalExtContainer } from "../../injection-providers/setupLocalExtContainer";
import { EngineAPIService } from "../../services/EngineAPIService";
import { NativeTreeView } from "../../views/common/treeview/NativeTreeView";
import { describeSingleWS } from "../testUtilsV3";

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
          const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();
          const engine = ExtensionProvider.getEngine() as EngineAPIService;
          await setupLocalExtContainer({ wsRoot, vaults, engine });
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
