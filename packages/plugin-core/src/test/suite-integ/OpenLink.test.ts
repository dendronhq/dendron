import { vault2Path } from "@dendronhq/common-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { OpenLinkCommand } from "../../commands/OpenLink";
import { expect, runSingleVaultTest } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";
import { VSCodeUtils } from "../../utils";
import { NoteProps } from "@dendronhq/common-all";

suite("OpenLink", function () {
  const ctx = setupBeforeAfter(this, {});

  test("error: cursor on non-link", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async () => {
        const cmd = new OpenLinkCommand();
        const { error } = await cmd.execute();
        expect(error!.message).toEqual("no valid path or URL selected");
        done();
      },
    });
  });

  //TODO
  test.skip("With an invalid character in the selection.", (done) => {
    let noteWithLink: NoteProps;
    runSingleVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithLink = await NoteTestUtilsV4.createNote({
          fname: "OpenLinkTest",
          vault: vaults[0],
          wsRoot,
          body: "Here we have some example text to search for URLs within",
        });
      },
      onInit: async () => {
        // Open and select some text
        const editor = await VSCodeUtils.openNote(noteWithLink);
        editor.selection = new vscode.Selection(8, 1, 8, 10);

        const cmd = new OpenLinkCommand();
        const { error } = await cmd.execute();
        expect(error!.message).toEqual("no valid path or URL selected");
        done();
      },
    });
  });

  //TODO
  test.skip("grab a URL under the cursor.", (done) => {
    let noteWithLink: NoteProps;
    runSingleVaultTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        noteWithLink = await NoteTestUtilsV4.createNote({
          fname: "OpenLinkTest",
          vault: vaults[0],
          wsRoot,
          body:
            "Here we have some example text to search for URLs within\n" +
            "https://www.dendron.so/",
        });
      },
      onInit: async () => {
        // Open and select some text
        const editor = await VSCodeUtils.openNote(noteWithLink);
        editor.selection = new vscode.Selection(9, 1, 9, 5);
        const cmd = new OpenLinkCommand();
        const text = await cmd.run();
        expect(text).toEqual("https://www.dendron.so/");
        done();
      },
    });
  });
  //TODO
  test.skip("With a partially selected URL.", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async () => {
        const cmd = new OpenLinkCommand();
        const { error } = await cmd.execute();
        expect(error!.message).toEqual("no valid path or URL selected");
        done();
      },
    });
  });
  // TODO
  test.skip("open in diff vault", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async ({ wsRoot, vaults }) => {
        ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
      },
      onInit: async ({ vaults, wsRoot }) => {
        const vault = vaults[1];
        const assetPath = path.join("assets", "foo.txt");
        const vpath = vault2Path({ vault, wsRoot });
        fs.ensureFileSync(path.join(vpath, assetPath));
        // TODO: write into the current note
        done();
      },
    });
  });
});
