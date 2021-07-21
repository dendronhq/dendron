import { DoctorActions } from "@dendronhq/dendron-cli";
import _ from "lodash";
import { FrontmatterContent } from "mdast";
import { CodeAction, CodeActionKind, CodeActionProvider, Diagnostic, DiagnosticSeverity, ExtensionContext, languages, Range, TextDocument } from "vscode";
import YAML from "yamljs";
import { DoctorCommand } from "../commands/Doctor";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";

/** Used to match the warnings to code actions. Also displayed for users along with the warning message. */
const BAD_FRONTMATTER_CODE = "bad frontmatter";
const FRONTMATTER_WARNING = languages.createDiagnosticCollection();
const RESOLVE_MESSAGE_AUTO_ONLY = "Please use the lightbulb, or run the Dendron: Doctor command.";
const RESOLVE_MESSAGE = "Please use the lightbulb, run the Dendron: Doctor command, or manually correct it.";


function badFrontmatter(props: Omit<Diagnostic, "source" | "code">) {
  return {
    /** Displayed to the user next to the warning message. */
    source: "Dendron",
    code: BAD_FRONTMATTER_CODE,
    ...props,
  }
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
  FRONTMATTER_WARNING.set(document.uri, [diagnostic]);
  return diagnostic;
}

export function warnBadFrontmatterContents(document: TextDocument, frontmatter: FrontmatterContent) {
  const ctx = "warnBadFrontmatterContents";
  const diagnostics: Diagnostic[] = [];
  const range = VSCodeUtils.position2VSCodeRange(frontmatter.position!);
  try {
    const frontmatterData = YAML.parse(frontmatter.value);
    if (!_.isString(frontmatterData.id)) {
      // Missing id
      diagnostics.push(badFrontmatter({
        message: `Note id is missing. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
        range,
        severity: DiagnosticSeverity.Error,
      }));
    } else if (frontmatterData.id.match(/^[-_]|[-_]$/)) {
      diagnostics.push(badFrontmatter({
        message: `Note id is bad, it will not work in Github publishing. ${RESOLVE_MESSAGE}`,
        range,
        severity: DiagnosticSeverity.Warning,
      }));
    }
  } catch (err) {
    Logger.info({ctx, msg: "failed to parse frontmatter", err});
    diagnostics.push(badFrontmatter({
      message: `The frontmatter is broken. ${RESOLVE_MESSAGE}`,
      range,
      severity: DiagnosticSeverity.Error,
    }));
  }
  FRONTMATTER_WARNING.set(document.uri, diagnostics);
  return diagnostics;
}


function activate(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      "markdown",
      doctorFrontmatterProvider,
    )
  );
}
export const codeActionProvider = {
  activate,
};

export const doctorFrontmatterProvider: CodeActionProvider = {
  provideCodeActions: (_document, _range, context, _token) => {
    // Only provide fix frontmatter action if the diagnostic is correct
    const diagnostics = context.diagnostics.filter((item) => item.code === BAD_FRONTMATTER_CODE);
    if (diagnostics.length === 0) return undefined;
    const action: CodeAction = {
      title: "Fix the frontmatter",
      diagnostics,
      isPreferred: true,
      kind: CodeActionKind.QuickFix,
      command: {
        command: new DoctorCommand().key,
        title: "Fix the frontmatter",
        arguments: [{scope: "file", action: DoctorActions.FIX_FRONTMATTER}]
      },
    };
    return [action];
  }
}
