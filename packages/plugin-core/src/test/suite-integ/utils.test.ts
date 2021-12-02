import { VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
import { PickerUtilsV2, VaultPickerItem } from "../../components/lookup/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Plugin Utils", function () {
  describe("PickerUtils", function () {
    const ctx = setupBeforeAfter(this);

    test("vault picker", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        postSetupHook: ENGINE_HOOKS.setupBasic,
        onInit: async ({ vaults }) => {
          const stub = sinon
            .stub(VSCodeUtils, "showQuickPick")
            .returns({} as any);
          await PickerUtilsV2.promptVault();
          const items: VaultPickerItem[] = vaults.map((vault) => ({
            vault,
            label: VaultUtils.getName(vault),
          }));
          expect(stub.calledOnceWith(items)).toBeTruthy();
          done();
        },
      });
    });
  });
});
