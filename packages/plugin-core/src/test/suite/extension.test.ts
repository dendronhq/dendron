import { DEngine, Note } from "@dendronhq/common-all";
import { EngineTestUtils } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import * as assert from "assert";
import _ from "lodash";
import { beforeEach, describe } from "mocha";
import { PickerUtils } from "../../components/lookup/LookupProvider";

suite("startup", function () {
  describe("PickerUtils", function () {
    let root: string;
    let engine: DEngine;

    beforeEach(async () => {
      root = EngineTestUtils.setupStoreDir();
      engine = DendronEngine.getOrCreateEngine({
        root,
        forceNew: true,
        mode: "exact",
      });
      await engine.init();
    });
    describe("non-namespace", function () {
      test("exact match", function () {
        const items: Note[] = [];
        const qs = "foo";
        const suggestions = PickerUtils.genSchemaSuggestions({
          items,
          qs,
          engine,
        });
        assert.deepEqual(suggestions, []);
      });
      /**
       * shouldn't display because namespace means arbitrary children
       */
      test("ends with dot", function () {
        const items: Note[] = [];
        const qs = "foo.";
        const suggestions = PickerUtils.genSchemaSuggestions({
          items,
          qs,
          engine,
        });
        assert.deepEqual(
          _.map(suggestions, (ent) => ent.fname),
          ["foo.one", "foo.three"]
        );
      });
    });

    describe("namespace", function () {
      test("exact match", function () {
        const items: Note[] = [];
        const qs = "bar";
        const suggestions = PickerUtils.genSchemaSuggestions({
          items,
          qs,
          engine,
        });
        assert.deepEqual(suggestions, []);
      });
      /**
       * shouldn't display because namespace means arbitrary children
       */
      test("ends with dot", function () {
        const items: Note[] = [];
        const qs = "bar.";
        const suggestions = PickerUtils.genSchemaSuggestions({
          items,
          qs,
          engine,
        });
        assert.deepEqual(suggestions, []);
      });
    });
  });
});
