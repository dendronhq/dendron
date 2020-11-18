import {
  languages,
  TextDocument,
  Position,
  CompletionItem,
  workspace,
  CompletionItemKind,
  Uri,
  ExtensionContext,
} from "vscode";
import path from "path";
import _ from "lodash";
import { fsPathToRef, RE_WIKI_LINK_ALIAS } from "../utils/md";
import { DendronWorkspace } from "../workspace";
import { NoteUtilsV2 } from "@dendronhq/common-all";

const padWithZero = (n: number): string => (n < 10 ? "0" + n : String(n));

export const provideCompletionItems = (
  document: TextDocument,
  position: Position
) => {
  const linePrefix = document
    .lineAt(position)
    .text.substr(0, position.character);

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);
  const isAliasAutocomplete = linePrefix.match(
    new RegExp(RE_WIKI_LINK_ALIAS, "gi")
  );

  if (!isDocsAutocomplete && !isResourceAutocomplete && !isAliasAutocomplete) {
    return undefined;
  }

  const completionItems: CompletionItem[] = [];
  const notes = DendronWorkspace.instance().getEngine().notes;
  const uris: Uri[] = _.values(notes).map((note) =>
    Uri.file(NoteUtilsV2.getPath({ note }))
  );

  const urisByPathBasename = _.groupBy(uris, ({ fsPath }) =>
    path.basename(fsPath).toLowerCase()
  );

  uris.forEach((uri, index) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return;
    }

    const longRef = fsPathToRef({
      path: uri.fsPath,
      basePath: workspaceFolder.uri.fsPath,
      keepExt: false, //containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const shortRef = fsPathToRef({
      path: uri.fsPath,
      keepExt: false, //containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const urisGroup =
      urisByPathBasename[path.basename(uri.fsPath).toLowerCase()] || [];

    const isFirstUriInGroup =
      urisGroup.findIndex((uriParam) => uriParam.fsPath === uri.fsPath) === 0;

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File);

    const linksFormat: any = "short"; //getMemoConfigProperty('links.format', 'short');

    item.insertText =
      linksFormat === "absolute" || !isFirstUriInGroup ? longRef : shortRef;

    // prepend index with 0, so a lexicographic sort doesn't mess things up
    item.sortText = padWithZero(index);

    completionItems.push(item);
  });

  return completionItems;
};

export const activate = (context: ExtensionContext) =>
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        provideCompletionItems,
      },
      "["
    )
  );

export const completionProvider = {
  activate,
};
