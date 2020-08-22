import { DEngine, Note } from "@dendronhq/common-all";
import { EngineTestUtils } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import * as assert from "assert";
import _ from "lodash";
import { beforeEach, describe } from "mocha";
import { PickerUtils } from "../../components/lookup/LookupProvider";
import { fsPathToRef } from "../../external/memo/utils/utils";

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
    }); // end non-namepsace

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

    describe("import", function () {
      beforeEach(async () => {
        root = EngineTestUtils.setupStoreDir({
          storeDirSrc: "engine-server.parser",
        });
        engine = DendronEngine.getOrCreateEngine({
          root,
          forceNew: true,
          mode: "exact",
        });
        await engine.init();
      });

      describe("non-namespace", () => {
        test("exact amtch", function () {
          const items: Note[] = [];
          const qs = "foo";
          const suggestions = PickerUtils.genSchemaSuggestions({
            items,
            qs,
            engine,
          });
          assert.deepEqual(
            _.map(suggestions, (ent) => ent.fname),
            []
          );
        });
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
            ["foo.bar", "foo.baz"]
          );
        });
      }); // end non-namespace

      describe("namespace", () => {
        test.skip("exact match", function () {
          const items: Note[] = [];
          const qs = "foo.baz.ns";
          const suggestions = PickerUtils.genSchemaSuggestions({
            items,
            qs,
            engine,
          });
          assert.deepEqual(
            _.map(suggestions, (ent) => ent.fname),
            []
          );
        });

        test("ends with dot", function () {
          const items: Note[] = [];
          const qs = "foo.baz.ns.";
          const suggestions = PickerUtils.genSchemaSuggestions({
            items,
            qs,
            engine,
          });
          assert.deepEqual(
            _.map(suggestions, (ent) => ent.fname),
            []
          );
        });
      }); // end namespace
    });
  });
});
