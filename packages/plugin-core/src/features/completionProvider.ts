import { NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import {
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  languages,
  Position,
  TextDocument,
  Uri,
  workspace,
} from "vscode";
import { Logger } from "../logger";
import { fsPathToRef } from "../utils/md";
import { DendronWorkspace } from "../workspace";

const padWithZero = (n: number): string => (n < 10 ? "0" + n : String(n));

export const provideCompletionItems = (
  document: TextDocument,
  position: Position
) => {
  const ctx = "provideCompletionItems";
  const linePrefix = document
    .lineAt(position)
    .text.substr(0, position.character);
  Logger.debug({ ctx, linePrefix, position, msg: "enter" });

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[[\w\|\.\#]*$/);

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  let refString = "";
  const startIndex = _.max<number>([
    _.lastIndexOf(linePrefix, "|"),
    _.lastIndexOf(linePrefix, "["),
  ]) as number;
  if (startIndex >= 0) {
    refString = linePrefix.slice(startIndex + 1, position.character);
    const endIndex = _.lastIndexOf(refString, ".");
    if (endIndex) {
      refString = refString.slice(0, endIndex + 1);
    }
  }
  Logger.debug({ ctx, refString });

  const completionItems: CompletionItem[] = [];
  const notes = DendronWorkspace.instance().getEngine().notes;
  const uris: Uri[] = _.values(notes).map((note) =>
    Uri.file(NoteUtils.getPathV4({ note, wsRoot: DendronWorkspace.wsRoot() }))
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

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File);
    item.insertText = longRef; //insertText;

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
