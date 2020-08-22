import { DNode } from "./node";
import { DNodeData, DNodeRawProps, RawPropsOpts } from "./types";
import _ from "lodash";

function omitEntropicProps(obj: DNodeRawProps, tsOnly?: boolean) {
  if (tsOnly) {
    return _.omit(obj, "updated", "created");
  }
  return _.omit(obj, "id", "parent", "children", "updated", "created");
}

/**
 * Remove properties that change
 * @param n1
 */
export function toSnapshotProps(n1: DNode, opts?: RawPropsOpts) {
  const out = omitEntropicProps(n1.toRawProps(false, opts));
  const parent = n1.parent?.title || "root";
  const children = n1.children.map((c) => c.title);
  return { ...out, parent, children };
}

export function expectSnapshot(
  expect: jest.Expect,
  name: string,
  n1: DNode<DNodeData> | DNode<DNodeData>[]
) {
  let snap;
  if (_.isArrayLike(n1)) {
    snap = n1.map((n) => toSnapshotProps(n, { ignoreNullParent: true }));
  } else {
    snap = toSnapshotProps(n1, { ignoreNullParent: true });
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

export const testUtilsCommonAll = {
  expectNodeEqual,
  expectSnapshot,
  toSnapshotProps,
  omitEntropicProps,
};
