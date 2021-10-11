import { DoctorActions } from "@dendronhq/dendron-cli";
import _ from "lodash";
import { FrontmatterContent } from "mdast";
import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Diagnostic,
  DiagnosticSeverity,
  ExtensionContext,
  languages,
  Range,
  Selection,
  TextDocument,
  Uri,
} from "vscode";
import { CancellationToken } from "vscode-jsonrpc";
import YAML from "yamljs";
import { DoctorCommand } from "../commands/Doctor";
import { GotoNoteCommand } from "../commands/GotoNote";
import { NoteLookupCommand } from "../commands/NoteLookupCommand";
import { RenameHeaderCommand } from "../commands/RenameHeader";
import { LookupSelectionTypeEnum } from "../components/lookup/types";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { sentryReportingCallback } from "../utils/analytics";
import { getHeaderAt, isBrokenWikilink } from "../utils/editor";
import { DendronExtension } from "../workspace";

/** Used to match the warnings to code actions. Also displayed for users along with the warning message. */
const BAD_FRONTMATTER_CODE = "bad frontmatter";
const FRONTMATTER_WARNING = languages.createDiagnosticCollection();
const RESOLVE_MESSAGE_AUTO_ONLY =
  "Please use the lightbulb, or run the Dendron: Doctor command.";
const RESOLVE_MESSAGE =
  "Please use the lightbulb, run the Dendron: Doctor command, or manually correct it.";

/** Delay displaying any warnings while the user is still typing.
 *
 * The user is considered to have stopped typing if they didn't type anything after 500ms.
 */
const delayedFrontmatterWarning = _.debounce(
  (uri: Uri, diagnostics: Diagnostic[]) => {
    FRONTMATTER_WARNING.set(uri, diagnostics);
  },
  500
);

function badFrontmatter(props: Omit<Diagnostic, "source" | "code">) {
  return {
    /** Displayed to the user next to the warning message. */
    source: "Dendron",
    code: BAD_FRONTMATTER_CODE,
    ...props,
  };
}

export function warnMissingFrontmatter(document: TextDocument) {
  const diagnostic: Diagnostic = badFrontmatter({
    message: `The frontmatter is missing. All notes in Dendron must have a frontmatter. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
    range: new Range(0, 0, 0, 0),
    severity: DiagnosticSeverity.Error,
  });
  // Setting this both here and also in `warnBadFrontmatterContents` could be
  // dangerous as every set discards the previous warnings. This is okay in this
  // case though since the frontmatter can't be missing and bad at the same
  // time.
  delayedFrontmatterWarning(document.uri, [diagnostic]);
  return diagnostic;
}

export function warnBadFrontmatterContents(
  document: TextDocument,
  frontmatter: FrontmatterContent
) {
  const ctx = "warnBadFrontmatterContents";
  const diagnostics: Diagnostic[] = [];
  const range = VSCodeUtils.position2VSCodeRange(frontmatter.position!);
  try {
    const frontmatterData = YAML.parse(frontmatter.value);
    if (!_.isString(frontmatterData.id)) {
      // Missing id
      diagnostics.push(
        badFrontmatter({
          message: `Note id is missing. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
          range,
          severity: DiagnosticSeverity.Error,
        })
      );
    } else if (frontmatterData.id.match(/^[-_]|[-_]$/)) {
      diagnostics.push(
        badFrontmatter({
          message: `Note id is bad, it will not work in Github publishing. ${RESOLVE_MESSAGE}`,
          range,
          severity: DiagnosticSeverity.Warning,
        })
      );
    }
  } catch (err) {
    Logger.info({ ctx, msg: "failed to parse frontmatter", err });
    diagnostics.push(
      badFrontmatter({
        message: `The frontmatter is broken. ${RESOLVE_MESSAGE}`,
        range,
        severity: DiagnosticSeverity.Error,
      })
    );
  }
  delayedFrontmatterWarning(document.uri, diagnostics);
  return diagnostics;
}

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
      if (diagnostics.length === 0) return undefined;
      const action: CodeAction = {
        title: "Fix the frontmatter",
        diagnostics,
        isPreferred: true,
        kind: CodeActionKind.QuickFix,
        command: {
          command: new DoctorCommand().key,
          title: "Fix the frontmatter",
          arguments: [{ scope: "file", action: DoctorActions.FIX_FRONTMATTER }],
        },
      };
      return [action];
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
    (
      _document: TextDocument,
      _range: Range | Selection,
      _context: CodeActionContext,
      _token: CancellationToken
    ) => {
      // No-op if we're not in a Dendron Workspace
      if (!DendronExtension.isActive()) {
        return;
      }
      const { editor, selection } = VSCodeUtils.getSelection();
      if (!editor || !selection) return;

      const header = getHeaderAt({
        editor,
        position: selection.start,
      });

      // action declaration
      const renameHeaderAction = {
        title: "Rename Header",
        isPreferred: true,
        kind: CodeActionKind.RefactorInline,
        command: {
          command: new RenameHeaderCommand().key,
          title: "Rename Header",
        },
      };
      const brokenWikilinkAction = {
        title: "Add missing note for wikilink declaration",
        isPreferred: true,
        kind: CodeActionKind.RefactorExtract,
        command: {
          command: new GotoNoteCommand().key,
          title: "Add missing note for wikilink declaration",
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
            },
          ],
        },
      };

      if (_range.isEmpty) {
        //return a code action for create note if user clicked next to a broken wikilink
        if (isBrokenWikilink()) {
          return [brokenWikilinkAction];
        }

        //return a code action for rename header if user clicks next to a header
        if (!_.isUndefined(header)) {
          return [renameHeaderAction];
        }
        // return if none
        return;
      } else {
        return !_.isUndefined(header)
          ? [createNewNoteAction, renameHeaderAction]
          : [createNewNoteAction];
      }
    }
  ),
};
