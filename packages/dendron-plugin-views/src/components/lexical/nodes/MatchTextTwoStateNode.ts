import {
  TextNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
  $createTextNode,
} from "lexical";
import _ from "lodash";
import {
  TwoStateNode,
  TwoStateNodeMode,
  TwoStateNodeMode as TwoStateNodeState,
} from "./TwoStateNode";

//TODO: Support partial bolded line: *this part is bolded* but this is not
export class MatchTextTwoStateNode extends TwoStateNode {
  // public __regex: RegExp = /\*\*(.*?)\*\*/;
  // public tag = "**";

  public __regex: RegExp;
  public tag;

  private static convertRawTextToFormatted(
    rawText: string,
    tag: string
  ): string {
    return _.trim(rawText, tag);
  }

  constructor(
    rawText: string,
    regex: RegExp,
    tag: string,
    state: TwoStateNodeState,
    key?: NodeKey
  ) {
    super(
      MatchTextTwoStateNode.convertRawTextToFormatted(rawText, tag),
      rawText,
      state,
      key
    );

    this.tag = tag;
    this.__regex = regex;

    if (state === TwoStateNodeState.formatted) {
      this.__format = 1;
    } else {
      this.__format = 0;
    }
  }

  static getType(): string {
    return "MatchTextTwoStateNode";
  }

  static clone(node: MatchTextTwoStateNode): MatchTextTwoStateNode {
    return new MatchTextTwoStateNode(
      node.__rawText,
      node.__regex,
      node.tag,
      node.__state,
      node.__key
    );
  }

  override setDisplayMode(mode: TwoStateNodeState) {
    const self = this.getLatest();
    self.__state = mode;

    if (mode === "raw") {
      self.setTextContent(self.getRawText());
      self.setFormat(0);
    } else {
      self.setTextContent(self.getDisplayText());
      self.setFormat(1);
    }
  }

  updateInternalTexts() {
    const self = this.getLatest();
    if (self.__state === TwoStateNodeState.raw) {
      self.__rawText = self.__text;
      self.__formattedText = _.trim(self.__text, this.tag);
    } else {
      self.__formattedText = self.__text;
      self.__rawText = `${this.tag}${self.__text}${this.tag}`;
    }
  }

  // createDOM(config: EditorConfig): HTMLElement {
  //   const element = super.createDOM(config);
  //   // element.style.color = this.__rawText;
  //   return element;
  // }

  // updateDOM(
  //   prevNode: FormattableNode,
  //   dom: HTMLElement,
  //   config: EditorConfig
  // ): boolean {
  //   const isUpdated = super.updateDOM(prevNode, dom, config);
  //   if (prevNode.__rawText !== this.__rawText) {
  //     dom.style.color = this.__rawText;
  //   }
  //   return isUpdated;
  // }
}

export function $createMatchTextTwoStateNode(
  rawText: string,
  regex: RegExp,
  tag: string
): MatchTextTwoStateNode {
  return new MatchTextTwoStateNode(
    rawText,
    regex,
    tag,
    TwoStateNodeState.formatted
  );
}

export function $onModification(node: MatchTextTwoStateNode) {
  // Don't do anything unless we're in raw mode - i.e. the user has the cursor inside the node
  if (node.getDisplayMode() === TwoStateNodeState.formatted) {
    return;
  }

  const matches = node.__text.match(node.__regex);

  // First check if there's any regex match, if not, then convert back to text node and we're done.
  if (!matches || matches.length === 0) {
    console.log(`onModification - doing a replace back to textNode`);
    node.replace($createTextNode(node.getRawText()));
    return;
  }

  console.log(
    `onModification - matches length: ${matches?.length} | matches index: ${matches.index} | node text: ${node.__text}, matches[0]: ${matches[0]}`
  );
  if (matches.index && matches.index > 0) {
    console.log(`onModification - Slicing Before`);
    const existing = node.__text;
    node.__text = node.__text.slice(matches.index);
    node.insertBefore($createTextNode(existing.slice(0, matches.index)));
    return;
  }

  console.log(
    `derp ${matches.index} | ${matches[0].length} | ${node.__text.length} | ${node.__text}`
  );
  if (
    matches.index !== undefined &&
    matches.index + matches[0].length < node.__text.length
  ) {
    console.log(`onModification - Slicing After`);
    const existing = node.__text;
    node.__text = node.__text.slice(
      matches.index,
      matches.index + matches[0].length
    );
    node.insertAfter(
      $createTextNode(existing.slice(matches.index + matches[0].length))
    );
    return;
  }

  // debugger;

  // node.updateInternalTexts();

  // const matches = node.__rawText.match(node.__regex);
  // debugger;
  // if (!matches || matches.length === 0) {
  //   node.replace($createTextNode(node.getRawText()));
  // } else {
  //   let dirty = false;
  //   if (matches.index && matches.index > 0) {
  //     node.insertBefore(
  //       $createTextNode(node.__rawText.slice(0, matches.index))
  //     );
  //     dirty = true;
  //   }

  //   if (
  //     matches.index &&
  //     matches.index + matches[0].length < node.__rawText.length
  //   ) {
  //     node.insertAfter(
  //       $createTextNode(node.__rawText.slice(matches.index + matches.length))
  //     );

  //     dirty = true;
  //   }

  //   if (dirty) {
  //     node.__rawText = node.__rawText.slice(
  //       matches.index,
  //       matches.index! + matches[0].length
  //     );
  //     node.__formattedText = _.trim(node.__rawText, node.tag);
  //     if (node.__state === TwoStateNodeMode.formatted) {
  //       node.setTextContent(node.__formattedText);
  //     } else {
  //       node.setTextContent(node.__rawText);
  //     }
  //   }

  //   debugger;
}

export function $isMatchTextTwoStateNode(
  node: LexicalNode | null | undefined
): node is MatchTextTwoStateNode {
  return node instanceof MatchTextTwoStateNode;
}

export function $setDisplayMode(
  node: MatchTextTwoStateNode,
  mode: TwoStateNodeState
) {
  if (node.getDisplayMode() !== mode) {
    node.setDisplayMode(mode);
  }
}
