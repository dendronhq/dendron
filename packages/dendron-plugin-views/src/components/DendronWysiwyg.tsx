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
import { $getRoot, $getSelection, $getNodeByKey } from "lexical";
import { useEffect } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { RootNode } from "lexical";
import { TextNode } from "lexical";

import { TreeView } from "@lexical/react/LexicalTreeView";
import UpdateListener from "./lexical/UpdateListener";

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

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

function JYMutationListener() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("Inside JYMutationListener");
    const removeMutationListener = editor.registerMutationListener(
      TextNode,
      (mutatedNodes) => {
        console.log(
          "Inside JYMutationListener callback. Size is " + mutatedNodes.size
        );
        // mutatedNodes is a Map where each key is the NodeKey, and the value is the state of mutation.
        for (var key in mutatedNodes) {
          console.log("found mutatedNode");
          console.log(key, mutatedNodes.get(key));
        }
      }
    );

    return () => {
      removeMutationListener();
    };
  }, [editor]);

  return null;
}

// function UpdateListener() {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     console.log("Inside UpdateListener");
//     const removeUpdateListener = editor.registerUpdateListener(
//       ({ editorState, dirtyElements, dirtyLeaves }) => {
//         console.log("Editor State Changed");
//         console.log(`Dirty Leaves Count: ${dirtyLeaves.size}`);
//         console.log(`Dirty Elements Count: ${dirtyElements.size}`);

//         // The latest EditorState can be found as `editorState`.
//         // To read the contents of the EditorState, use the following API:

//         // for (const [key, value] of dirtyElements.entries()) {
//         //   console.log("found dirtyElement");
//         //   console.log(key, value);
//         // }

//         for (const value of dirtyLeaves.values()) {
//           console.log("found dirtyLeaf");
//           const node = editorState._nodeMap.get(value);
//           // debugger;
//           console.log(value);
//           console.log(node?.__text);
//           // debugger;
//         }

//         // debugger;

//         const foo = "outside var";

//         editorState.read(() => {
//           console.log("Inside editor State Read");
//           console.log(foo);

//           debugger;
//           for (const value in dirtyLeaves.values()) {
//             console.log("found dirtyLeaf inside read");
//             debugger;
//             const node = $getNodeByKey(value);
//             debugger;
//           }

//           // Just like editor.update(), .read() expects a closure where you can use
//           // the $ prefixed
//         });
//       }
//     );

//     return () => {
//       removeUpdateListener();
//     };
//   }, [editor]);

//   return null;
// }

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

  const initialConfig = {
    namespace: "MyEditor",
    theme,
    onError,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div>Enter some text...</div>}
      />
      <OnChangePlugin onChange={onChange} />
      <HistoryPlugin />
      <MyCustomAutoFocusPlugin />
      <MarkdownShortcutPlugin />
      <TreeViewPlugin />
      {/* <JYMutationListener /> */}
      <UpdateListener />
    </LexicalComposer>
  );
};

export default DendronWysiwyg;
