import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useEffect } from "react";

import { $convertFromMarkdownString } from "@lexical/markdown";

export default function VSCodeMsgReceiverPlugin({
  initialText,
}: {
  initialText: string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      console.log(`Setting Initial State`);
      $convertFromMarkdownString(initialText);
    });

    return;
  }, [initialText, editor]);

  return null;
}
