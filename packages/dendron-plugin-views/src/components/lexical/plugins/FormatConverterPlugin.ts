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

export default function FormatConverterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("Inside FormatConverterPlugin");

    editor.registerNodeTransform(TextNode, (textNode) => {
      console.log(
        `FormatConverterPlugin - TextNode with key ${textNode.getKey()}. Contents: ${textNode.getTextContent()}`
      );

      const content = textNode.getTextContent();

      if (
        (!$isFormattableNode(textNode) && content.match(/^\*.*\*$/)?.length) ||
        0
      ) {
        console.log("Replacing with Formattable Node");
        textNode.replace($createFormattableNode(_.trim(content, "*"), content));
      }

      // This transform runs twice but does nothing the first time because it doesn't meet the preconditions

      // textNode.getTextContent();
      // if (textNode.getTextContent() === "modified") {
      //   textNode.setTextContent("re-modified");
      // }
    });

    return;
  });

  useEffect(() => {
    editor.registerNodeTransform(FormattableNode, (node) => {
      console.log(
        `FormatConverterPlugin - TextNode with key ${node.getKey()}. Contents: ${node.getTextContent()}`
      );

      const content = node.getTextContent();

      if (
        (!$isFormattableNode(node) && content.match(/^\*.*\*$/)?.length) ||
        0
      ) {
        console.log("Replacing with Formattable Node");
        node.replace($createFormattableNode(_.trim(content, "*"), content));
      }

      // This transform runs twice but does nothing the first time because it doesn't meet the preconditions

      // textNode.getTextContent();
      // if (textNode.getTextContent() === "modified") {
      //   textNode.setTextContent("re-modified");
      // }
    });

    return;
  });

  return null;
}
