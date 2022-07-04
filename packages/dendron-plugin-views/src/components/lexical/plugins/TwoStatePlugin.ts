import { $getNodeByKey, $setSelection } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $isLineBreakNode, $isTextNode } from "lexical";

import { useEffect } from "react";

import {
  DMessageSource,
  EditorChange,
  EditorChangeMessage,
  EditorMessageEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { postVSCodeMessage } from "../../../utils/vscode";
import {
  $isElementTwoStateNode,
  $onElementTwoStateNodeModification,
  ElementTwoStateNode,
} from "../nodes/ElementTwoStateNode";
import {
  $isMatchTextTwoStateNode,
  $onModification,
  MatchTextTwoStateNode,
  onModificationResult,
} from "../nodes/MatchTextTwoStateNode";
import { TwoStateNode } from "../nodes/TwoStateNode";

import { $getSelection, $isRangeSelection } from "lexical";

import {
  $isTwoStateNode,
  $setDisplayMode,
  TwoStateNodeMode,
} from "../nodes/TwoStateNode";

export default function TwoStatePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // TODO: See if we can use a generic TwoStateNode version to handle all updates instead of registering multiple transformers.
    editor.registerNodeTransform(MatchTextTwoStateNode, (node) => {
      if (!$isMatchTextTwoStateNode(node)) {
        return;
      }

      console.log(
        `Running onModification for MatchTextTwoStateNode ${node.getKey()}`
      );

      const modOperation = $onModification(node);

      console.log(`Finished Mod Operation: ${modOperation}`);

      switch (modOperation) {
        case onModificationResult.createdNodeAfter:
          console.log("Modifying cursor pos to after");
          node.selectNext(1, 1);
          break;
        case onModificationResult.createdNodeBefore:
          console.log("Modifying cursor pos to before");
          node.selectPrevious(1, 1);
          break;
      }
      if (modOperation) {
      }
    });

    // TODO: Register unsubscribers
    editor.registerNodeTransform(ElementTwoStateNode, (node) => {
      if (!$isElementTwoStateNode(node)) {
        return;
      }

      console.log(
        `Running onModification for ElementTwoStateNode ${node.getKey()}`
      );

      $onElementTwoStateNodeModification(node);

      console.log("foobar");
      // newNode?.select(0, 0);
      // console.log("foobar selected");
    });

    return;
  });

  // This effect is for watching where the editor selection (cursor) is and if
  // it's inside a TwoStateNode, then show the twostatenode's raw text
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        const nodesLosingFocus: TwoStateNode[] = [];
        const nodesGainingFocus: TwoStateNode[] = [];

        prevEditorState.read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();

            console.log("Node(s) out of selection:");
            nodes.forEach((node) => {
              console.log(` - ${node.getKey()}`);
              if ($isTwoStateNode(node)) {
                console.log(`TwoStateNode ${node.getKey()} out of focus`);
                nodesLosingFocus.push(node);
              }
            });
          }
        });

        editorState.read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();

            console.log(`${nodes.length} node(s) in selection:`);
            nodes.forEach((node) => {
              console.log(` - ${node.getKey()}`);
              if ($isTwoStateNode(node)) {
                console.log(`TwoStateNode ${node.getKey()} in focus`);
                nodesGainingFocus.push(node);
              }
            });
          }
        });

        const nodesToUpdateGainingFocus = _.differenceWith(
          nodesGainingFocus,
          nodesLosingFocus,
          (left, right) => {
            return left.getKey() === right.getKey();
          }
        );

        const nodesToUpdateLosingFocus = _.differenceWith(
          nodesLosingFocus,
          nodesGainingFocus,
          (left, right) => {
            return left.getKey() === right.getKey();
          }
        );

        editor.update(() => {
          // console.log(
          //   `Node Count to update gaining focus: ${nodesToUpdateGainingFocus.length}`
          // );
          nodesToUpdateGainingFocus.forEach((node) => {
            console.log(`Update on node ${node.getKey()} gaining focus`);
            $setDisplayMode(node, TwoStateNodeMode.raw);

            const offset = node.getCursorOffset();
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              selection.anchor.offset += offset;
              selection.focus.offset += offset;
            }

            $setSelection(selection);

            //TODO: I think some cursor adjustment needs to happen here.
          });

          // console.log(
          //   `Node Count to update losing focus: ${nodesToUpdateLosingFocus.length}`
          // );
          nodesToUpdateLosingFocus.forEach((node) => {
            if ($getNodeByKey(node.getKey())) {
              console.log(`Update on node ${node.getKey()} losing focus`);
              $setDisplayMode(node, TwoStateNodeMode.formatted);
            }
          });
        });
      }
    );

    return () => {
      removeUpdateListener();
    };
  }, [editor]);

  // const matchFn = function (text: string): null | EntityMatch {
  //   console.log(`TwoStatePlugin - matchFn. str: ${text}`);
  //   const regex = /\*\*(.*?)\*\*/;
  //   const matches = text.match(regex);

  //   if (!matches || matches.length === 0 || !matches.index) {
  //     console.log("TwoStatePlugin - matchFn: returning null");
  //     return null;
  //   }

  //   const foo = {
  //     start: matches.index,
  //     end: matches.index + matches[0].length,
  //   };

  //   console.log(`TwoStatePlugin - matchFn: returning ${foo}`);
  //   return foo;
  // };

  // const createNode = function (textNode: TextNode): MatchTextTwoStateNode {
  //   console.log("TwoStatePlugin - Create Node");
  //   return $createMatchTextTwoStateNode(textNode.__text, /\*\*(.*?)\*\*/, "**");
  // };

  // useEffect(() => {
  //   registerLexicalTextEntity(
  //     editor,
  //     matchFn,
  //     MatchTextTwoStateNode,
  //     createNode
  //   );
  //   return;
  // });

  return null;
}
