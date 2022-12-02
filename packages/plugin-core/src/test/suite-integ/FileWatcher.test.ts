import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  ENGINE_HOOKS_MULTI,
  TestConfigUtils,
} from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import path from "path";
import * as vscode from "vscode";
import { FileWatcher } from "../../fileWatcher";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { ConfigService, URI } from "@dendronhq/common-all";

suite("GIVEN FileWatcher", function () {
  let watcher: FileWatcher;
  const ctx = setupBeforeAfter(this, {
    beforeHook: () => {},
  });

  describe("WHEN onDidCreate is configured", () => {
    describe("AND the default watcher was used", () => {
      test("THEN created notes are picked up by the engine", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          postSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
          onInit: async ({ vaults, wsRoot, engine }) => {
            await NoteTestUtilsV4.createNote({
              fname: "newbar",
              body: "newbar body",
              vault: vaults[0],
              wsRoot,
            });
            const dendronConfig = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();

            watcher = new FileWatcher({
              workspaceOpts: {
                wsRoot,
                vaults,
                dendronConfig,
              },
            });

            const notePath = path.join(wsRoot, vaults[0].fsPath, "newbar.md");
            const uri = vscode.Uri.file(notePath);
            await watcher.onDidCreate(uri.fsPath);
            const note = (await engine.getNoteMeta("newbar")).data!;
            const root = (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[0],
              })
            )[0];
            expect(note.parent).toEqual(root.id);
            done();
          },
        });
      });
    });
    describe("AND the engine watcher was used", () => {
      test("THEN created notes are picked up by the engine", (done) => {
        runLegacyMultiWorkspaceTest({
          ctx,
          postSetupHook: async (opts) => {
            await ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
            await TestConfigUtils.withConfig(
              (config) => {
                config.dev = { ...config.dev, forceWatcherType: "engine" };
                return config;
              },
              { wsRoot: opts.wsRoot }
            );
          },
          onInit: async ({ vaults, wsRoot, engine }) => {
            await NoteTestUtilsV4.createNote({
              fname: "newbar",
              body: "newbar body",
              vault: vaults[0],
              wsRoot,
            });
            const dendronConfig = (
              await ConfigService.instance().readConfig(URI.file(wsRoot))
            )._unsafeUnwrap();

            watcher = new FileWatcher({
              workspaceOpts: {
                wsRoot,
                vaults,
                dendronConfig,
              },
            });

            const notePath = path.join(wsRoot, vaults[0].fsPath, "newbar.md");
            const uri = vscode.Uri.file(notePath);
            await watcher.onDidCreate(uri.fsPath);
            const note = (await engine.getNoteMeta("newbar")).data!;
            const root = (
              await engine.findNotesMeta({
                fname: "root",
                vault: vaults[0],
              })
            )[0];
            expect(note.parent).toEqual(root.id);
            done();
          },
        });
      });
    });
  });
});
