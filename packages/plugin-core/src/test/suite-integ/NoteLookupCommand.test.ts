import {
  ENGINE_HOOKS_MULTI,
  NOTE_PRESETS_V4,
  sinon,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { describe } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { TIMEOUT } from "../testUtils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

suite("LookupCommandV3", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);
  ctx = setupBeforeAfter(this, {
    afterHook: async () => {
      sinon.restore();
    },
  });
  describe("onAccept with modifiers", function () {
    test("lookupConfirmVaultOnCreate = true, existing vault", function (done) {
      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
        onInit: async ({ wsRoot, vaults }) => {
          withConfig(
            (config) => {
              config.lookupConfirmVaultOnCreate = true;
              return config;
            },
            { wsRoot }
          );

          const fname = NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.fname;
          const vault = _.find(vaults, { fsPath: "vault2" });
          const cmd = new NoteLookupCommand();
          sinon
            .stub(PickerUtilsV2, "promptVault")
            .returns(Promise.resolve(vault));
          const { quickpick } = (await cmd.run({
            noConfirm: true,
            initialValue: fname,
            fuzzThreshold: 1,
          }))!;
          // should have next pick
          expect(_.isUndefined(quickpick?.nextPicker)).toBeFalsy();
          // selected items shoudl equal
          expect(quickpick.selectedItems.length).toEqual(1);
          expect(_.pick(quickpick.selectedItems[0], ["id", "vault"])).toEqual({
            id: fname,
            vault,
          });
          done();
        },
      });
    });
  });
});
