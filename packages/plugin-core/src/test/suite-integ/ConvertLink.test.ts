import { NoteProps } from "@dendronhq/common-all";
import {
  CreateNoteOptsV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { LinkUtils, ParseLinkV2Resp } from "@dendronhq/unified";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import sinon from "sinon";
import vscode, { TextEditor } from "vscode";
import { ConvertLinkCommand } from "../../commands/ConvertLink";
import { ExtensionProvider } from "../../ExtensionProvider";
import { getReferenceAtPosition } from "../../utils/md";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

const getReference = async ({
  editor,
  position,
}: {
  editor: TextEditor;
  position: vscode.Position;
}) => {
  const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
  const out = await getReferenceAtPosition({
    document: editor.document,
    position,
    wsRoot,
    vaults,
  });
  if (!out) {
    throw new Error("ref should be truthy");
  }
  return out;
};

suite("ConvertLink", function () {
  let activeNote: NoteProps;
  let activeNoteCreateOpts: CreateNoteOptsV4;
  let anotherNote: NoteProps;

  const noAliasBrokenLinkPosition = new vscode.Position(7, 0);
  const aliasBrokenLinkPosition = new vscode.Position(8, 0);

  describeMultiWS(
    "GIVEN note with broken links",
    {
      preSetupHook: async (opts) => {
        const { vaults, wsRoot } = opts;
        activeNoteCreateOpts = {
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "[[foo.bar.broken.link]]", // link 7
            "[[broken link|foo.bar.broken.link]]", // line 8
          ].join("\n"),
          genRandomId: true,
        };
        activeNote = await NoteTestUtilsV4.createNote(activeNoteCreateOpts);
        anotherNote = await NoteTestUtilsV4.createNote({
          fname: "another",
          vault: vaults[0],
          wsRoot,
          genRandomId: true,
        });
      },
    },
    () => {
      let sandbox: sinon.SinonSandbox;
      beforeEach(async () => {
        sandbox = sinon.createSandbox();
        activeNote = await NoteTestUtilsV4.createNote(activeNoteCreateOpts);
        await WSUtils.openNote(activeNote);
      });

      afterEach(async () => {
        sandbox.restore();
        await VSCodeUtils.closeAllEditors();
      });

      test("WHEN broken link with no alias, THEN doesn't show option to use alias text.", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: noAliasBrokenLinkPosition,
        });
        const { options, parsedLink } =
          cmd.prepareBrokenLinkConvertOptions(reference);
        expect(parsedLink.alias).toBeFalsy();
        expect(
          _.findIndex(options, (option) => {
            return option.label === "Alias";
          })
        ).toEqual(-1);
      });

      test("WHEN alias option selected, THEN converts broken link to plain alias text", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          aliasBrokenLinkPosition,
          aliasBrokenLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: aliasBrokenLinkPosition,
        });
        sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
          option: {
            label: "Alias",
          },
          parsedLink: LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
          }) as ParseLinkV2Resp,
        });
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("broken link");
      });

      test("WHEN note name option selected, THEN converts broken link to note name text", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          aliasBrokenLinkPosition,
          aliasBrokenLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: aliasBrokenLinkPosition,
        });
        sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
          option: {
            label: "Note name",
          },
          parsedLink: LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
          }) as ParseLinkV2Resp,
        });
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("link");
      });

      test("WHEN hierarchy option selected, THEN converts broken link to hierarchy text", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          aliasBrokenLinkPosition,
          aliasBrokenLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: aliasBrokenLinkPosition,
        });
        sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
          option: {
            label: "Hierarchy",
          },
          parsedLink: LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
          }) as ParseLinkV2Resp,
        });
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("foo.bar.broken.link");
      });

      test("WHEN prompt option selected, THEN prompts for user input and converts broken link to user input", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          aliasBrokenLinkPosition,
          aliasBrokenLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: aliasBrokenLinkPosition,
        });
        sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
          option: {
            label: "Prompt",
          },
          parsedLink: LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
          }) as ParseLinkV2Resp,
        });
        sandbox.stub(cmd, "promptBrokenLinkUserInput").resolves("user input");
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("user input");
      });

      test("WHEN change destination option selected, THEN prompts lookup for new destination and converts broken link to new link", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          aliasBrokenLinkPosition,
          aliasBrokenLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        const reference = await getReference({
          editor,
          position: aliasBrokenLinkPosition,
        });
        sandbox.stub(cmd, "promptBrokenLinkConvertOptions").resolves({
          option: {
            label: "Change destination",
          },
          parsedLink: LinkUtils.parseLinkV2({
            linkString: reference.refText,
            explicitAlias: true,
          }) as ParseLinkV2Resp,
        });
        sandbox.stub(cmd, "lookupNewDestination").resolves({
          selectedItems: [
            {
              ...anotherNote,
              label: "another",
            },
          ],
          onAcceptHookResp: [],
        });
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("[[Another|another]]");
      });
    }
  );

  const userTagPosition = new vscode.Position(7, 0);
  const userWikiLinkPosition = new vscode.Position(8, 0);
  const hashTagPosition = new vscode.Position(9, 0);
  const tagWikiLinkPosition = new vscode.Position(10, 0);
  const regularWikiLinkPosition = new vscode.Position(11, 0);
  const plainTextPosition = new vscode.Position(12, 0);

  describeMultiWS(
    "GIVEN note with valid links",
    {
      preSetupHook: async (opts) => {
        const { vaults, wsRoot } = opts;
        activeNoteCreateOpts = {
          fname: "active",
          vault: vaults[0],
          wsRoot,
          body: [
            "@timothy", // link 7
            "[[user.timothy]]", // line 8
            "#foo", // line 9
            "[[tags.foo]]", // line 10
            "[[root]]", // line 11
            "plaintext", // line 12
          ].join("\n"),
          genRandomId: true,
        };
        activeNote = await NoteTestUtilsV4.createNote(activeNoteCreateOpts);
        anotherNote = await NoteTestUtilsV4.createNote({
          fname: "another",
          vault: vaults[0],
          wsRoot,
          genRandomId: true,
        });
        await NoteTestUtilsV4.createNote({
          fname: "user.timothy",
          vault: vaults[0],
          wsRoot,
          genRandomId: true,
        });
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
          genRandomId: true,
        });
      },
    },
    () => {
      let sandbox: sinon.SinonSandbox;
      beforeEach(async () => {
        sandbox = sinon.createSandbox();
        activeNote = await NoteTestUtilsV4.createNote(activeNoteCreateOpts);
        await WSUtils.openNote(activeNote);
      });

      afterEach(async () => {
        sandbox.restore();
        await VSCodeUtils.closeAllEditors();
      });

      test("WHEN usertag, THEN convert to correct wikilink", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          userTagPosition,
          userTagPosition
        );
        const cmd = new ConvertLinkCommand();
        sandbox.stub(cmd, "promptConfirmation").resolves(true);
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("[[user.timothy]]");
      });

      test("WHEN wikilink with user.* hierarchy, THEN convert to usertag", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          userWikiLinkPosition,
          userWikiLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        sandbox.stub(cmd, "promptConfirmation").resolves(true);
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("@timothy");
      });

      test("WHEN hashtag, THEN convert to correct wikilink", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          hashTagPosition,
          hashTagPosition
        );
        const cmd = new ConvertLinkCommand();
        sandbox.stub(cmd, "promptConfirmation").resolves(true);
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("[[tags.foo]]");
      });

      test("WHEN wikilink with tags.* hierarchy, THEN convert to hashtag", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          tagWikiLinkPosition,
          tagWikiLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        sandbox.stub(cmd, "promptConfirmation").resolves(true);
        const gatherOut = await cmd.gatherInputs();
        expect(gatherOut.text).toEqual("#foo");
      });

      test("WHEN regular valid link, THEN raise error", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          regularWikiLinkPosition,
          regularWikiLinkPosition
        );
        const cmd = new ConvertLinkCommand();
        try {
          await cmd.gatherInputs();
        } catch (error) {
          expect(error).toBeTruthy();
        }
      });

      test("WHEN plaintext, THEN raise error", async () => {
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        editor.selection = new vscode.Selection(
          plainTextPosition,
          plainTextPosition
        );
        const cmd = new ConvertLinkCommand();
        try {
          await cmd.gatherInputs();
        } catch (error) {
          expect(error).toBeTruthy();
        }
      });
    }
  );
});
