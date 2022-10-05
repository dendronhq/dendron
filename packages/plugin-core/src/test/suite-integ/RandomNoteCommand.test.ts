import { ConfigUtils, RandomNoteConfig } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import * as vscode from "vscode";
import { RandomNoteCommand } from "../../commands/RandomNote";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  setupBeforeAfter,
  withConfig,
} from "../testUtilsV3";

// common template function for RandomNoteCommand testing
function basicTest({
  ctx,
  noteNames,
  validateFn,
  done,
  includePattern,
  excludePattern,
}: {
  ctx: vscode.ExtensionContext;
  noteNames: string[];
  validateFn: () => void;
  done: () => void;
  includePattern?: string[];
  excludePattern?: string[];
}) {
  runLegacyMultiWorkspaceTest({
    ctx,
    preSetupHook: async ({ wsRoot, vaults }) => {
      for (const name of noteNames) {
        await NoteTestUtilsV4.createNote({
          vault: TestEngineUtils.vault1(vaults),
          wsRoot,
          fname: name,
          body: "",
        });
      }
    },
    onInit: async ({ wsRoot }) => {
      withConfig(
        (config) => {
          const randomCfg: RandomNoteConfig = {};
          if (includePattern) randomCfg.include = includePattern;
          if (excludePattern) randomCfg.exclude = excludePattern;
          ConfigUtils.setCommandsProp(config, "randomNote", randomCfg);
          return config;
        },
        { wsRoot }
      );

      await new RandomNoteCommand(ExtensionProvider.getExtension()).run();
      validateFn();
      done();
    },
  });
}

suite(DENDRON_COMMANDS.RANDOM_NOTE.key, function () {
  const ctx = setupBeforeAfter(this, {});

  test("include pattern only", (done) => {
    const validateFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: ["alpha", "alpha.one", "alpha.two.1", "alpha.two.2", "beta"],
      validateFn,
      done,
      includePattern: ["alpha"],
      excludePattern: undefined,
    });
  });

  test("include pattern with exclude in sub-hierarchy", (done) => {
    const validateFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.one")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: ["alpha.one", "alpha.two.1", "alpha.two.2"],
      validateFn,
      done,
      includePattern: ["alpha"],
      excludePattern: ["alpha.two"],
    });
  });

  test("multiple include patterns", (done) => {
    const validateFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.two")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: ["alpha.one", "alpha.two"],
      validateFn,
      done,
      includePattern: ["alpha.zero", "alpha.two"],
      excludePattern: undefined,
    });
  });

  // If no include pattern is specified, then the set should include all notes.
  test("no include pattern", (done) => {
    const validateFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("root")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: [],
      validateFn,
      done,
      includePattern: undefined,
      excludePattern: undefined,
    });
  });

  test("exclude pattern only", (done) => {
    const validateFn = function () {
      const fileName = VSCodeUtils.getActiveTextEditor()
        ?.document.uri.path.split("/")
        .pop()!;

      expect(
        fileName.startsWith("beta") || fileName.startsWith("root")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: ["alpha.one", "alpha.two", "beta.one", "beta.two"],
      validateFn,
      done,
      includePattern: undefined,
      excludePattern: ["alpha"],
    });
  });

  test("multi-level include pattern", (done) => {
    const validateFn = function () {
      expect(
        VSCodeUtils.getActiveTextEditor()
          ?.document.uri.path.split("/")
          .pop()!
          .startsWith("alpha.one")
      ).toBeTruthy();
    };

    basicTest({
      ctx,
      noteNames: ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
      validateFn,
      done,
      includePattern: ["alpha.one"],
      excludePattern: undefined,
    });
  });

  test("include and exclude patterns are the same", (done) => {
    // No explicit validation, just ensure that an exception is not thrown.
    const validateFn = function () {};

    basicTest({
      ctx,
      noteNames: ["alpha.one.1", "alpha.one.2", "alpha.two.1", "alpha.two.one"],
      validateFn,
      done,
      includePattern: ["alpha.one"],
      excludePattern: ["alpha.one"],
    });
  });
});
