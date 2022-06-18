import { VaultUtils } from "@dendronhq/common-all";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import sinon from "sinon";
import { PickerUtilsV2, VaultPickerItem } from "../../components/lookup/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import * as assert from "assert";

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

  describe("When there is no selection, try to parse a wiki link from the cursor's position", function () {
    test("THEN a wiki link is recognized", function () {
      assert.deepStrictEqual(
        { label: "", link: "dendron.note.vegetable.tomato" },
        VSCodeUtils.parseWikiLink("[[ dendron.note.vegetable.tomato ]]")
      );
    });
    test("THEN a labelled wiki link is recognized", function () {
      assert.deepStrictEqual(
        { label: "label", link: "link" },
        VSCodeUtils.parseWikiLink("[[label|link]]")
      );
    });
    test("THEN multi-word label is ok", function () {
      assert.deepStrictEqual(
        { label: "this is a label", link: "dendron.note.fruit.tomato" },
        VSCodeUtils.parseWikiLink(
          "[[     this is a label  |     dendron.note.fruit.tomato ]]"
        )
      );
    });
    test("THEN a markdown link is rejected", function () {
      assert.deepStrictEqual(
        { label: "", link: "" },
        VSCodeUtils.parseWikiLink("[link text](dendron.note.name.md)")
      );
    });
    test("THEN an image link is rejected", function () {
      assert.deepStrictEqual(
        { label: "", link: "" },
        VSCodeUtils.parseWikiLink(
          "![image alt text](http://image.url/or/path/to/image)"
        )
      );
    });
    test("THEN if the cursor is not in a link, the parsing also fails", function () {
      assert.deepStrictEqual(
        { label: "", link: "" },
        VSCodeUtils.parseWikiLink("someRandomWord")
      );
    });
  });
});
