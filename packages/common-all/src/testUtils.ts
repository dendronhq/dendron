import { DNode } from "./node";
import { DNodeData } from "./types";
import _ from "lodash";
import { DNodeRawProps } from "../lib";

/**
 * Remove properties that change
 * @param n1 
 */
export function toSnapshotProps(n1: DNode) {
  const out = omitEntropicProps(n1.toRawProps());
  const parent = n1.parent?.title || "root";
  const children = n1.children.map(c => c.title);
  return { ...out, parent, children };
}

function omitEntropicProps(obj: DNodeRawProps) {
  return _.omit(obj, "id", "parent", "children", "updated", "created");
}

export function expectSnapshot(
  expect: jest.Expect,
  name: string,
  n1: DNode<DNodeData> | DNode<DNodeData>[]
) {
  let snap;
  if (_.isArrayLike(n1)) {
    snap = n1.map(n => toSnapshotProps(n));
  } else {
    snap = toSnapshotProps(n1);
  }
  expect(snap).toMatchSnapshot(name);
}

export function expectNodeEqual(
  expect: jest.Expect,
  n1: DNode<DNodeData>,
  n2: DNode<DNodeData>
) {
  expect(n1.id).toEqual(n2.id);
}

export const testUtils = {
  expectNodeEqual,
  expectSnapshot,
  toSnapshotProps,
  omitEntropicProps,
};
