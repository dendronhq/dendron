import { NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import { DecorationOptions, ExtensionContext, Range, window } from "vscode";
import { Logger } from "./logger";
import { CodeConfigKeys, DateTimeFormat } from "./types";
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
    window.onDidChangeActiveTextEditor(
      (editor) => {
        const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
        if (
          editor &&
          editor.document.uri.fsPath ===
            window.activeTextEditor?.document.uri.fsPath
        ) {
          const uri = editor.document.uri;
          Logger.info({ ctx, msg: "enter", uri: editor?.document.uri });
          if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
            Logger.info({ ctx, uri: uri.fsPath, msg: "not in workspace" });
            return;
          }
          this.triggerUpdateDecorations();
        }
      },
      null,
      context.subscriptions
    );
  }

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
}
