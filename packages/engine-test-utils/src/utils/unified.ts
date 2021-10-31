import _ from "lodash";
import { Node as UnistNode } from "unist";
import { checkString } from ".";
import { expect } from "@jest/globals";

export class TestUnifiedUtils {
  static verifyPrivateLink = ({
    contents,
    value,
  }: {
    contents: string;
    value: string;
  }) => {
    return checkString(contents, "color: brown", value + " (Private)");
  };

  /** Gets the descendent (child, or child of child...) node of a given node.
   *
   * @param node The root node to start descending from.
   * @param indices Left-to-right indexes for children, e.g. first index is for the root, second is for the child of the root...
   * @returns Requested child. Note that this function has no way of checking types, so the child you get might not be of the right type.
   */
  static getDescendantNode<Child extends UnistNode>(
    node: UnistNode,
    ...indices: number[]
  ): Child {
    const index = indices.shift();
    if (_.isUndefined(index)) return node as Child;
    // TODO: pass in instead of call
    expect(node).toHaveProperty("children");
    // @ts-ignore
    expect(node.children).toHaveProperty("length");
    // @ts-ignore
    const children = node.children as UnistNode[];
    expect(children.length).toBeGreaterThanOrEqual(index);
    return this.getDescendantNode<Child>(children[index], ...indices);
  }
}
