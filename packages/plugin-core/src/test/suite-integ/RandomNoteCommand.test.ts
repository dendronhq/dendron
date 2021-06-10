import { RandomNoteConfig } from "@dendronhq/common-all";
import { CreateNoteFactory } from "@dendronhq/common-test-utils";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { RandomNoteCommand } from "../../commands/RandomNote";
import { VSCodeUtils } from "../../utils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

// common template function for RandomNoteCommand testing
function basicTest(
  ctx: vscode.ExtensionContext,
  noteNames: string[],
  validateFn: () => void,
  done: () => void,
  includePattern?: string[],
  excludePattern?: string[]
) {
  runLegacyMultiWorkspaceTest({
    ctx,
    preSetupHook: async ({ wsRoot, vaults }) => {
      for (let name of noteNames) {
        await CreateNoteFactory({ fname: name, body: "" }).create({
          wsRoot,
          vault: TestEngineUtils.vault1(vaults),
        });
      }
    },
    onInit: async ({ wsRoot }) => {
      withConfig(
        (config) => {
          let randomCfg: RandomNoteConfig = {};
          if (includePattern) randomCfg.include = includePattern;
          if (excludePattern) randomCfg.exclude = excludePattern;
          config.randomNote = randomCfg;
          return config;
        },
        { wsRoot }
      );

      await new RandomNoteCommand().run();
      validateFn();
      done();
    },
  });
}

suite(RandomNoteCommand.key, function () {
  let ctx: vscode.ExtensionContext;
  ctx = setupBeforeAfter(this, {});

  test("include pattern only", function (done) {
    const validation = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha")
      ).toBeTruthy();
    };

    basicTest(
      ctx,
      ["alpha", "alpha.one", "alpha.two.1", "alpha.two.2", "beta"],
      validation,
      done,
      ["alpha"],
      undefined
    );
  });

  test("include pattern with exclude in sub-hierarchy", function (done) {
    const validationsFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.one")
      ).toBeTruthy();
    };

    basicTest(
      ctx,
      ["alpha.one", "alpha.two.1", "alpha.two.2"],
      validationsFn,
      done,
      ["alpha"],
      ["alpha.two"]
    );
  });

  test("multiple include patterns", function (done) {
    const validationsFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.two")
      ).toBeTruthy();
    };

    basicTest(
      ctx,
      ["alpha.one", "alpha.two"],
      validationsFn,
      done,
      ["alpha.zero", "alpha.two"],
      undefined
    );
  });

  // If no include pattern is specified, then the set should include all notes.
  test("no include pattern", function (done) {
    const validationsFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("root")
      ).toBeTruthy();
    };

    basicTest(ctx, [], validationsFn, done, undefined, undefined);
  });

  test("exclude pattern only", function (done) {
    const validationsFn = function () {
      const fileName = VSCodeUtils.getActiveTextEditor()
        ?.document.uri.path.split("/")
        .pop()!;

      expect(
        fileName.startsWith("beta") || fileName.startsWith("root")
      ).toBeTruthy();
    };

    basicTest(
      ctx,
      ["alpha.one", "alpha.two", "beta.one", "beta.two"],
      validationsFn,
      done,
      undefined,
      ["alpha"]
    );
  });

  test("multi-level include pattern", function (done) {
    const validationsFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.one")
      ).toBeTruthy();
    };

    basicTest(
      ctx,
      ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
      validationsFn,
      done,
      ["alpha.one"],
      undefined
    );
  });

  test("include and exclude patterns are the same", function (done) {
    // No explicit validation, just ensure that an exception is not thrown.
    const validationsFn = function () {};

    basicTest(
      ctx,
      ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
      validationsFn,
      done,
      ["alpha.one"],
      ["alpha.one"]
    );
  });
});
