import {
  NodeTestUtilsV2,
  NoteTestUtilsV3,
  runMochaHarness,
} from "@dendronhq/common-test-utils";
import assert from "assert";
import { afterEach, beforeEach } from "mocha";
import path from "path";
import * as vscode from "vscode";
import DefinitionProvider from "../../features/DefinitionProvider";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { GOTO_NOTE_PRESET } from "../presets/GotoNotePreset";
import { TIMEOUT } from "../testUtils";
import { LocationTestUtils, runMultiVaultTest } from "../testUtilsv2";

suite("DocumentLinkProvider", function () {
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ vaults }) => {
        const root = vaults[0];
        await NodeTestUtilsV2.createNote({
          vaultDir: root.fsPath,
          noteProps: { body: "[[alpha]]", fname: "alpha" },
        });
        await NodeTestUtilsV2.createNote({
          vaultDir: root.fsPath,
          noteProps: { body: "[[alpha]]", fname: "beta" },
        });
      },
      onInit: async ({ vaults }) => {
        const notePath = path.join(vaults[0].fsPath, "alpha.md");
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(notePath)
        );
        const doc = editor?.document as vscode.TextDocument;
        const referenceProvider = new DefinitionProvider();
        const locations = (await referenceProvider.provideDefinition(
          doc,
          new vscode.Position(7, 2),
          null as any
        )) as vscode.Location;
        assert.strictEqual(
          path.basename(locations.uri.fsPath as string),
          "alpha.md"
        );
        done();
      },
    });
  });

  test("with anchor", (done) => {
    runMultiVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await GOTO_NOTE_PRESET.preSetupHook({ wsRoot, vaults });
        await NoteTestUtilsV3.createNote({
          fname: "beta",
          vault,
          body: `[[alpha#h3]]`,
        });
      },
      onInit: async ({ vaults }) => {
        const notePath = path.join(vaults[0].fsPath, "beta.md");
        const editor = await VSCodeUtils.openFileInEditor(
          vscode.Uri.file(notePath)
        );
        const doc = editor?.document as vscode.TextDocument;
        const provider = new DefinitionProvider();
        const pos = LocationTestUtils.getPresetWikiLinkPosition();
        const loc = (await provider.provideDefinition(
          doc,
          pos,
          null as any
        )) as vscode.Location;
        assert.strictEqual(
          LocationTestUtils.getBasenameFromLocation(loc),
          "alpha.md"
        );
        await runMochaHarness(GOTO_NOTE_PRESET.results);
        done();
      },
    });
  });
});
