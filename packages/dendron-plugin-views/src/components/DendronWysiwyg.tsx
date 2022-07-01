import {
  DMessageSource,
  FOOTNOTE_DEF_CLASS,
  FOOTNOTE_REF_CLASS,
  NoteViewMessageEnum,
} from "@dendronhq/common-all";
import {
  createLogger,
  DendronNote,
  engineHooks,
} from "@dendronhq/common-frontend";
import _, { remove } from "lodash";
import mermaid from "mermaid";
import React from "react";
import {
  useCurrentTheme,
  useMermaid,
  useRenderedNoteBody,
  useWorkspaceProps,
} from "../hooks";
import { DendronComponent } from "../types";
import { postVSCodeMessage } from "../utils/vscode";
import { $getRoot, $getSelection, $getNodeByKey, LexicalEditor } from "lexical";
import { useEffect } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { BOLD_STAR, TEXT_MATCH_TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import { RootNode } from "lexical";
import { TextNode } from "lexical";

import { TreeView } from "@lexical/react/LexicalTreeView";
import UpdateListener from "./lexical/plugins/UpdateListener";
import FormatConverterPlugin from "./lexical/plugins/FormatConverterPlugin";
import { FormattableNode } from "./lexical/nodes/FormattableNode";

import { TRANSFORMERS, ITALIC_UNDERSCORE, LINK } from "@lexical/markdown";
import {
  DENDRON_BOLD,
  JY_HEADING,
  JY_LINK,
} from "./lexical/nodes/Transformers";

import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MatchTextTwoStateNode } from "./lexical/nodes/MatchTextTwoStateNode";
import TwoStatePlugin from "./lexical/plugins/TwoStatePlugin";

// --- Start Lexical Code Block

const theme = {
  // Theme styling goes here
  // ...
};

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: any) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    // console.log(root, selection);
  });
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  console.error(error);
}

function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();
  return (
    <TreeView
      viewClassName="tree-view-output"
      timeTravelPanelClassName="debug-timetravel-panel"
      timeTravelButtonClassName="debug-timetravel-button"
      timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
      timeTravelPanelButtonClassName="debug-timetravel-panel-button"
      editor={editor}
    />
  );
}

// --- End Lexical Code Block

const DendronWysiwyg: DendronComponent = (props) => {
  const ctx = "DendronWysiwyg";
  const logger = createLogger("DendronWysiwyg");
  const noteProps = props.ide.noteActive;
  const config = props.engine.config;
  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  useConfig({ opts: workspace });

  function InitEditor(editor: LexicalEditor): void {
    console.log(`Init Editor; Note Props Body is ${noteProps?.body}`);
    // editor.setEditorState();
  }

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
    nodes: [
      MatchTextTwoStateNode,
      FormattableNode,
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Enter some text...</div>}
        initialEditorState={InitEditor}
      />
      <OnChangePlugin onChange={onChange} />
      <HistoryPlugin />
      <MarkdownShortcutPlugin
        transformers={[DENDRON_BOLD, JY_HEADING, ITALIC_UNDERSCORE, JY_LINK]}
      />
      <TreeViewPlugin />
      <UpdateListener />
      <TwoStatePlugin />
      {/* <FormatConverterPlugin /> */}
    </LexicalComposer>
  );
};

export default DendronWysiwyg;
