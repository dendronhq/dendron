import _ from "lodash";
import { FrontmatterContent } from "mdast";
import {
  Diagnostic,
  DiagnosticSeverity,
  languages,
  Range,
  TextDocument,
  Uri,
} from "vscode";
import YAML from "yamljs";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";

/** Used to match the warnings to code actions. Also displayed for users along with the warning message. */
const BAD_FRONTMATTER_CODE = "bad frontmatter";
const FRONTMATTER_WARNING = languages.createDiagnosticCollection();
const NOT_A_STUB = "not a stub";
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

function badFrontmatter(props: Omit<Diagnostic, "source">) {
  return {
    /** Displayed to the user next to the warning message. */
    source: "Dendron",
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

export function checkAndWarnBadFrontmatter(
  document: TextDocument,
  frontmatter: FrontmatterContent
) {
  const ctx = "checkAndWarnBadFrontmatter";
  const diagnostics: Diagnostic[] = [];
  const range = VSCodeUtils.position2VSCodeRange(frontmatter.position!);
  const note = WSUtils.getNoteFromDocument(document);
  try {
    const frontmatterData = YAML.parse(frontmatter.value);
    if (!_.isString(frontmatterData.id)) {
      // Missing id
      diagnostics.push(
        badFrontmatter({
          message: `Note id is missing. ${RESOLVE_MESSAGE_AUTO_ONLY}`,
          range,
          code: BAD_FRONTMATTER_CODE,
          severity: DiagnosticSeverity.Error,
        })
      );
    } else if (frontmatterData.id.match(/^[-_]|[-_]$/)) {
      diagnostics.push(
        badFrontmatter({
          message: `Note id is bad, it will not work in Github publishing. ${RESOLVE_MESSAGE}`,
          range,
          code: BAD_FRONTMATTER_CODE,
          severity: DiagnosticSeverity.Warning,
        })
      );
    } else if (note && frontmatterData.stub && _.trim(note.body) !== "") {
      diagnostics.push(
        badFrontmatter({
          message: `This note is not a stub, Please remove the stub property or update it to false`,
          range,
          code: NOT_A_STUB,
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
