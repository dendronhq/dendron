import { $getRoot, $getNodeByKey } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  EditorState,
  ElementNode,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
  TextNode,
} from "lexical";

import { $isElementNode } from "lexical";
import { useEffect } from "react";

import { registerLexicalTextEntity, EntityMatch } from "@lexical/text";
import { postVSCodeMessage } from "../../../utils/vscode";
import {
  DMessageSource,
  EditorChange,
  EditorChangeMessage,
  EditorMessageEnum,
} from "@dendronhq/common-all";
import {
  $createFormattableNode,
  $isFormattableNode,
  FormattableNode,
} from "../nodes/FormattableNode";
import _ from "lodash";
import {
  $createMatchTextTwoStateNode,
  $isMatchTextTwoStateNode,
  $onModification,
  MatchTextTwoStateNode,
} from "../nodes/MatchTextTwoStateNode";

export default function TwoStatePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("Inside TwoStatePlugin");

    editor.registerNodeTransform(MatchTextTwoStateNode, (node) => {
      if (!$isMatchTextTwoStateNode(node)) {
        return;
      }

      console.log(
        `Running onModification for MatchTextTwoStateNode ${node.getKey()}`
      );

      $onModification(node);
    });

    return;
  });

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
