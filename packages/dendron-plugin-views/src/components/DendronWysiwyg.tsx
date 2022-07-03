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
import { registerCodeHighlighting } from "@lexical/code";

import { RootNode } from "lexical";
import { TextNode } from "lexical";

import { TreeView } from "@lexical/react/LexicalTreeView";
import {
  ITALIC_UNDERSCORE,
  LINK,
  STRIKETHROUGH,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
} from "@lexical/markdown";
import {
  DENDRON_BOLD,
  DENDRON_ITALICS,
  JY_HEADING,
  JY_LINK,
} from "./lexical/nodes/Transformers";

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";

import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MatchTextTwoStateNode } from "./lexical/nodes/MatchTextTwoStateNode";
import TwoStatePlugin from "./lexical/plugins/TwoStatePlugin";
import { ElementTwoStateNode } from "./lexical/nodes/ElementTwoStateNode";
import DendronTreeViewPlugin from "./lexical/components/DendronTreeViewPlugin";
import UpdateVSCodePlugin from "./lexical/plugins/UpdateVSCodePlugin";
import ExampleThemes from "./lexical/themes/ExampleThemes";

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

function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  return null;
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  console.error(error);
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

    $convertFromMarkdownString("foo\nfoobar\n\nbar\n");

    // editor.setEditorState();
  }

  const initialConfig = {
    namespace: "MyEditor",
    theme: ExampleThemes,
    onError,
    nodes: [
      ElementTwoStateNode,
      MatchTextTwoStateNode,
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
    <div style={{ margin: 10 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div>Enter some text...</div>}
          initialEditorState={InitEditor}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        <MarkdownShortcutPlugin
          transformers={[
            DENDRON_BOLD,
            DENDRON_ITALICS,
            JY_HEADING,
            JY_LINK,
            CODE,
            STRIKETHROUGH, // Needed to get around the undefined error
            UNORDERED_LIST,
            ORDERED_LIST,
          ]}
        />
        <DendronTreeViewPlugin />
        <UpdateVSCodePlugin />
        <TwoStatePlugin />
        <ListPlugin />
        <CodeHighlightPlugin />
      </LexicalComposer>
    </div>
  );
};

export default DendronWysiwyg;
