import { $nodesOfType, TextNode } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useEffect } from "react";

import { EngineState } from "@dendronhq/common-frontend/lib/features/engine/slice";
import { $createNoteRefNode, NoteRefNode } from "../nodes/NoteRefNode";

export default function NoteRefPlugin({ engine }: { engine: EngineState }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeTransformListener = editor.registerNodeTransform(
      TextNode,
      (node) => {
        const regExp = /!\[\[(.*?)\]\]/;

        const matches = node.getTextContent().match(regExp);

        if (matches && matches.length > 0) {
          console.log(`Found NoteRef match! Match 1 is ${matches[1]}`);
          const noteRefNode = $createNoteRefNode(
            "test-note-ref-node",
            matches[1],
            engine
          );
          node.replace(noteRefNode);
        }
      }
    );

    return () => {
      removeTransformListener();
    };
  });

  useEffect(() => {
    editor.update(() => {
      console.log(`Calling editor.update on note refs`);
      const noteRefNodes = $nodesOfType<NoteRefNode>(NoteRefNode);

      noteRefNodes.forEach((node) => {
        console.log(`NoteRefPlugin - replacing node with key ${node.getKey()}`);
        const replacement = $createNoteRefNode(
          "test-note-ref-node",
          node.__noteRef,
          engine
        );
        node.replace(replacement);
      });
    });
  }, [engine.notesRendered]);

  return null;
}
