import {
  ContextualUIEvents,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import { BAD_FRONTMATTER_CODE } from "@dendronhq/unified";
import isUrl from "is-url";
import _ from "lodash";
import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  ExtensionContext,
  languages,
  Range,
  Selection,
  TextDocument,
} from "vscode";
import { CancellationToken } from "vscode-jsonrpc";
import { CopyNoteRefCommand } from "../commands/CopyNoteRef";
import { DoctorCommand } from "../commands/Doctor";
import { GotoNoteCommand } from "../commands/GotoNote";
import { NoteLookupCommand } from "../commands/NoteLookupCommand";
import { PasteLinkCommand } from "../commands/PasteLink";
import { RenameHeaderCommand } from "../commands/RenameHeader";
import { ExtensionProvider } from "../ExtensionProvider";
import { sentryReportingCallback } from "../utils/analytics";
import { EditorUtils } from "../utils/EditorUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtilsV2 } from "../WSUtilsV2";

function activate(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      "markdown",
      doctorFrontmatterProvider
    ),
    languages.registerCodeActionsProvider("markdown", refactorProvider)
  );
}
export const codeActionProvider = {
  activate,
};

export const doctorFrontmatterProvider: CodeActionProvider = {
  provideCodeActions: sentryReportingCallback(
    (
      _document: TextDocument,
      _range: Range | Selection,
      context: CodeActionContext,
      _token: CancellationToken
    ) => {
      // No-op if we're not in a Dendron Workspace
      if (!DendronExtension.isActive()) {
        return;
      }
      // Only provide fix frontmatter action if the diagnostic is correct
      const diagnostics = context.diagnostics.filter(
        (item) => item.code === BAD_FRONTMATTER_CODE
      );
      if (diagnostics.length !== 0) {
        const action: CodeAction = {
          title: "Fix the frontmatter",
          diagnostics,
          isPreferred: true,
          kind: CodeActionKind.QuickFix,
          command: {
            command: new DoctorCommand(ExtensionProvider.getExtension()).key,
            title: "Fix the frontmatter",
            arguments: [
              { scope: "file", action: DoctorActionsEnum.FIX_FRONTMATTER },
            ],
          },
        };
        return [action];
      }
      return undefined;
    }
  ),
};

/**
 * Code Action Provider for Refactor.
 * 1. Refactor Code Action for Rename Header
 * 2. Refactor Code Action for Broken Wikilinks
 * 3. Refactor Extract for highlighted text
 * (Similar to the current functionality of creating a new note in 'Selection Extract' mode)
 */
export const refactorProvider: CodeActionProvider = {
  provideCodeActions: sentryReportingCallback(
    async (
      _document: TextDocument,
      _range: Range | Selection,
      _context: CodeActionContext,
      _token: CancellationToken
    ) => {
      // No-op if we're not in a Dendron Workspace
      const ext = ExtensionProvider.getExtension();
      if (!(await ext.isActiveAndIsDendronNote(_document.uri.fsPath))) {
        return;
      }

      const { editor, selection, text } = VSCodeUtils.getSelection();
      if (!editor || !selection) return;

      const header = EditorUtils.getHeaderAt({
        document: editor.document,
        position: selection.start,
      });

      // action declaration
      const renameHeaderAction = {
        title: "Rename Header",
        isPreferred: true,
        kind: CodeActionKind.RefactorInline,
        command: {
          command: new RenameHeaderCommand(ExtensionProvider.getExtension())
            .key,
          title: "Rename Header",
          arguments: [{ source: ContextualUIEvents.ContextualUICodeAction }],
        },
      };
      const brokenWikilinkAction = {
        title: "Add missing note for wikilink declaration",
        isPreferred: true,
        kind: CodeActionKind.RefactorExtract,
        command: {
          command: new GotoNoteCommand(ExtensionProvider.getExtension()).key,
          title: "Add missing note for wikilink declaration",
          arguments: [{ source: ContextualUIEvents.ContextualUICodeAction }],
        },
      };
      const createNewNoteAction = {
        title: "Extract text to new note",
        isPreferred: true,
        kind: CodeActionKind.RefactorExtract,
        command: {
          command: new NoteLookupCommand().key,
          title: "Extract text to new note",
          arguments: [
            {
              selectionType: LookupSelectionTypeEnum.selectionExtract,
              source: ContextualUIEvents.ContextualUICodeAction,
            },
          ],
        },
      };

      const copyHeaderRefAction = {
        title: "Copy Header Reference",
        isPreferred: true,
        kind: CodeActionKind.RefactorInline,
        command: {
          command: new CopyNoteRefCommand(ExtensionProvider.getExtension()).key,
          title: "Copy Header Reference",
          arguments: [{ source: ContextualUIEvents.ContextualUICodeAction }],
        },
      };

      const WrapAsMarkdownLink = {
        title: "Wrap as Markdown Link",
        isPreferred: true,
        kind: CodeActionKind.RefactorInline,
        command: {
          command: new PasteLinkCommand().key,
          title: "Wrap as Markdown Link",
          arguments: [
            {
              source: ContextualUIEvents.ContextualUICodeAction,
              link: text,
              selection,
            },
          ],
        },
      };

      if (_range.isEmpty) {
        const { engine } = ext.getDWorkspace();
        const note = await new WSUtilsV2(ext).getActiveNote();
        //return a code action for create note if user clicked next to a broken wikilink
        if (
          note &&
          (await EditorUtils.isBrokenWikilink({
            editor,
            engine,
            note,
            selection,
          }))
        ) {
          return [brokenWikilinkAction];
        }

        //return a code action for rename header and copy header ref if user clicks next to a header
        if (!_.isUndefined(header)) {
          return [renameHeaderAction, copyHeaderRefAction];
        }
        // return if none
        return;
      } else {
        //regex for url
        if (!_.isUndefined(text) && isUrl(text)) {
          return [WrapAsMarkdownLink];
        }
        return !_.isUndefined(header)
          ? [createNewNoteAction, renameHeaderAction, copyHeaderRefAction]
          : [createNewNoteAction];
      }
    }
  ),
};
