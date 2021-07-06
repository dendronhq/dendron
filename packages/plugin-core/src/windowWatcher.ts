import {
  DendronWebViewKey,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV5 } from "@dendronhq/engine-server";
import _ from "lodash";
import { DateTime } from "luxon";
import visit from "unist-util-visit";
import {
  DecorationOptions,
  ExtensionContext,
  Range,
  Selection,
  TextEditor,
  window,
} from "vscode";
import { ShowPreviewV2Command } from "./commands/ShowPreviewV2";
import { Logger } from "./logger";
import { CodeConfigKeys, DateTimeFormat } from "./types";
import { VSCodeUtils } from "./utils";
import { getConfigValue, getWS } from "./workspace";

const tsDecorationType = window.createTextEditorDecorationType({
  //   borderWidth: "1px",
  //   borderStyle: "solid",
  //   overviewRulerColor: "blue",
  //   overviewRulerLane: OverviewRulerLane.Right,
  //   light: {
  //     // this color will be used in light color themes
  //     borderColor: "darkblue",
  //   },
  //   dark: {
  //     // this color will be used in dark color themes
  //     borderColor: "lightblue",
  //   },
});

export class WindowWatcher {
  activate(context: ExtensionContext) {
    window.onDidChangeVisibleTextEditors((editors) => {
      const ctx = "WindowWatcher:onDidChangeVisibleTextEditors";
      const editorPaths = editors.map((editor) => {
        return editor.document.uri.fsPath;
      });
      Logger.info({ ctx, editorPaths });
    });
    window.onDidChangeActiveTextEditor(
      this.onDidChangeActiveTextEditor,
      this,
      context.subscriptions
    );
  }

  onDidChangeActiveTextEditor = (editor: TextEditor | undefined) => {
    const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
    if (
      editor &&
      editor.document.uri.fsPath ===
        window.activeTextEditor?.document.uri.fsPath
    ) {
      const uri = editor.document.uri;
      Logger.info({ ctx, editor: uri.fsPath });
      if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        Logger.info({ ctx, uri: uri.fsPath, msg: "not in workspace" });
        return;
      }
      this.triggerUpdateDecorations();
      this.triggerNoteGraphViewUpdate();
      this.triggerSchemaGraphViewUpdate();
      this.triggerNotePreviewUpdate(editor);

      if (getWS().workspaceWatcher?.getNewlyOpenedDocument(editor.document)) {
        this.onFirstOpen(editor);
      }
    } else {
      Logger.info({ ctx, editor: "undefined" });
    }
  };

  /**
   * Add text decorator to frontmatter
   * @returns
   */
  async triggerUpdateDecorations(text?: string) {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const createTSDecorator = (tsMatch: RegExpExecArray) => {
      const startPos = activeEditor.document.positionAt(tsMatch.index);
      const endPos = activeEditor.document.positionAt(
        tsMatch.index + tsMatch[0].length
      );
      const ts = _.toInteger(_.trim(tsMatch[0].split(":")[1], `'" `));

      const dt = DateTime.fromMillis(ts);
      const tsConfig = getConfigValue(
        CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT
      ) as DateTimeFormat;
      const formatOption = DateTime[tsConfig];
      const decoration: DecorationOptions = {
        range: new Range(startPos, endPos),
        renderOptions: {
          after: {
            contentText: `  (${dt.toLocaleString(formatOption)})`,
          },
        },
      };
      return decoration;
    };
    text = text || activeEditor.document.getText();

    let match = NoteUtils.RE_FM.exec(text);
    if (!_.isNull(match)) {
      const decorations = [
        NoteUtils.RE_FM_UPDATED,
        NoteUtils.RE_FM_CREATED,
      ].map((RE) => {
        const tsMatch = RE.exec((match as RegExpExecArray)[0]);
        if (tsMatch) {
          return createTSDecorator(tsMatch);
        }
        return;
      });
      activeEditor.setDecorations(
        tsDecorationType,
        decorations.filter((ent) => !_.isUndefined(ent)) as DecorationOptions[]
      );
    }
    return;
  }

  async triggerNoteGraphViewUpdate() {
    const noteGraphPanel = getWS().getWebView(DendronWebViewKey.NOTE_GRAPH);
    if (!_.isUndefined(noteGraphPanel)) {
      if (noteGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        noteGraphPanel.webview.postMessage({
          type: "onDidChangeActiveTextEditor",
          data: {
            note,
            sync: true,
          },
          source: "vscode",
        } as OnDidChangeActiveTextEditorMsg);
      }
    }
    return;
  }
  async triggerSchemaGraphViewUpdate() {
    const schemaGraphPanel = getWS().getWebView(DendronWebViewKey.SCHEMA_GRAPH);
    if (!_.isUndefined(schemaGraphPanel)) {
      if (schemaGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        schemaGraphPanel.webview.postMessage({
          type: "onDidChangeActiveTextEditor",
          data: {
            note,
            sync: true,
          },
          source: "vscode",
        } as OnDidChangeActiveTextEditorMsg);
      }
    }
    return;
  }

  async triggerNotePreviewUpdate({ document }: TextEditor) {
    ShowPreviewV2Command.onDidChangeHandler(document);
    return;
  }

  private async onFirstOpen(editor: TextEditor) {
    Logger.info({
      msg: "First open of note",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
    this.moveCursorPastFrontmatter(editor);
    if (getWS().config.autoFoldFrontmatter) {
      await this.foldFrontmatter();
    }
  }

  private moveCursorPastFrontmatter(editor: TextEditor) {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(editor.document.getText());
    visit(parsed, ["yaml"], (node) => {
      if (_.isUndefined(node.position)) return false; // Should never happen
      const position = VSCodeUtils.point2VSCodePosition(
        node.position.end,
        // Move past frontmatter + one line after the end because otherwise this ends up inside frontmatter when folded.
        // This also makes sense because the front
        { line: 1 }
      );
      editor.selection = new Selection(position, position);
      // Found the frontmatter already, stop traversing
      return false;
    });
  }

  private async foldFrontmatter() {
    await VSCodeUtils.foldActiveEditorAtPosition({ line: 0 });
  }
}
