import {
  TextNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
} from "lexical";

export enum TwoStateNodeMode {
  raw = "raw",
  formatted = "formatted",
}
//TODO: Support partial bolded line: *this part is bolded* but this is not
export abstract class TwoStateNode extends TextNode {
  __rawText: string;
  __formattedText: string;
  __state: TwoStateNodeMode;

  constructor(
    displayText: string,
    rawText: string,
    state: TwoStateNodeMode,
    key?: NodeKey
  ) {
    super(state === TwoStateNodeMode.raw ? rawText : displayText, key);
    this.__rawText = rawText;
    this.__formattedText = displayText;
    this.__state = state;
  }

  static getType(): string {
    return "formattable";
  }

  // static clone(node: TwoStateNode): TwoStateNode {
  //   return new TwoStateNode(
  //     node.__formattedText,
  //     node.__rawText,
  //     node.__state,
  //     node.__key
  //   );
  // }

  getFormattedText(): string {
    const self = this.getLatest();
    return self.__formattedText;
  }

  getRawText(): string {
    const self = this.getLatest();
    return self.__rawText;
  }

  getDisplayMode(): TwoStateNodeMode {
    const self = this.getLatest();
    return self.__state;
  }

  setDisplayMode(mode: TwoStateNodeMode) {
    const self = this.getLatest();
    self.__state = mode;
  }

  //TODO: Cleanup
  abstract getCursorOffset(): number;

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

// export function $createFormattableNode(
//   text: string,
//   rawText: string
// ): TwoStateNode {
//   return new TwoStateNode(text, rawText, TwoStateNodeMode.formatted);
// }

export function $isTwoStateNode(
  node: LexicalNode | null | undefined
): node is TwoStateNode {
  return node instanceof TwoStateNode;
}

export function $setDisplayMode(node: TwoStateNode, mode: TwoStateNodeMode) {
  if (node.getDisplayMode() !== mode) {
    node.setDisplayMode(mode);
  }
}
