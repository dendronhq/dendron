import _ from "lodash";
import { Diagnostic, languages, Uri } from "vscode";

const FRONTMATTER_WARNING = languages.createDiagnosticCollection();

/** Delay displaying any warnings while the user is still typing.
 *
 * The user is considered to have stopped typing if they didn't type anything after 500ms.
 */
export const delayedFrontmatterWarning = _.debounce(
  (uri: Uri, diagnostics: Diagnostic[]) => {
    FRONTMATTER_WARNING.set(uri, diagnostics);
  },
  500
);
