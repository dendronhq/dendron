import {
  TextNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
  $createTextNode,
  $createParagraphNode,
  $isParagraphNode,
  DecoratorNode,
} from "lexical";
import _ from "lodash";
import {
  TwoStateNode,
  TwoStateNodeMode,
  TwoStateNodeMode as TwoStateNodeState,
} from "./TwoStateNode";

import { $isHeadingNode } from "@lexical/rich-text";
import { DendronComponent } from "../../../types";
import { ReactElement, useEffect } from "react";

import { MDUtilsV5 } from "@dendronhq/engine-server";
import NoteRef from "../components/NoteRef";
import { EngineState } from "@dendronhq/common-frontend/lib/features/engine/slice";
import { MarkdownSerializable } from "./MarkdownSerializable";

export class NoteRefNode
  extends DecoratorNode<ReactElement>
  implements MarkdownSerializable
{
  __id: string;
  __noteRef: string;
  __engineState: EngineState; // TODO: EngineState is extreme overkill here.

  static getType(): string {
    return "noteRef";
  }

  static clone(node: NoteRefNode): NoteRefNode {
    return new NoteRefNode(
      node.__id,
      node.__noteRef,
      node.__engineState,
      node.__key
    );
  }

  constructor(id: string, noteRef: string, engine: EngineState, key?: NodeKey) {
    super(key);
    this.__id = id;
    this.__noteRef = noteRef;
    this.__engineState = engine;
  }

  serialize(): string {
    const self = this.getLatest();
    return `![[${self.__noteRef}]]`;
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactElement {
    return <NoteRef engine={this.__engineState} fname={this.__noteRef} />;
  }
}

export function $createNoteRefNode(
  id: string,
  noteRef: string,
  engine: EngineState
): NoteRefNode {
  return new NoteRefNode(id, noteRef, engine);
}

export function $isNoteRefNode(
  node: LexicalNode | null | undefined
): node is NoteRefNode {
  return node instanceof NoteRefNode;
}
