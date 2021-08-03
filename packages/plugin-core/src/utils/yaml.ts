import {
  Mapping,
  MappingItem,
  Node as YamlUnistNode,
  Parent as YamlUnistParent,
  parse as yamlparse,
  Plain,
} from "yaml-unist-parser";
import type { YAML } from "mdast";
import _ from "lodash";


export function isYamlUnistParent(node: any): node is YamlUnistParent {
  return _.isArray(node?.children);
}

export function isMappingItem(node: any): node is MappingItem {
  return node?.type === "mappingItem";
}

export function isPlain(node: any): node is Plain {
  return node?.type === "plain";
}

/** `unist-util-visit`, kind of, but for YamlUnist.
 *
 * The reason this is duplicated here is that even though YamlUnist is
 * technically Unist compatible, the types don't match so we can't use the unist
 * function.
 */
export function visitYamlUnist(
  node: YamlUnistNode | YamlUnistNode[],
  visitor: (node: YamlUnistNode) => boolean | undefined | void | null
) {
  const toVisit: YamlUnistNode[] = _.isArray(node) ? [...node] : [node];
  while (toVisit.length > 0) {
    const item = toVisit.pop();
    if (_.isUndefined(item)) return;
    const out = visitor(item);
    if (out === false) return;
    if (isYamlUnistParent(item)) {
      toVisit.push(...item.children);
    }
  }
}

/** Get the mapping items (`key: value`) from the frontmatter. */
export function parseFrontmatter(frontmatter: YAML | string) {
  const parsed = yamlparse(
    _.isString(frontmatter) ? frontmatter : frontmatter.value
  );
  const mapping = (parsed.children[0]?.children[1]?.children[0] as Mapping)
    ?.children;
  return mapping;
}

export function getFrontmatterTags(frontmatter: MappingItem[]) {
  const tags: Plain[] = [];
  visitYamlUnist(frontmatter, (node) => {
    if (!isMappingItem(node)) return;
    const [key, value] = node.children;
    let isTags = false;
    visitYamlUnist(key, (keyPlain) => {
      if (!isPlain(keyPlain)) return;
      if (keyPlain.value === "tags") {
        isTags = true;
        return false; // stop traversal
      }
      return;
    });
    if (!isTags) return;
    visitYamlUnist(value, (valuePlain) => {
      if (!isPlain(valuePlain)) return;
      tags.push(valuePlain);
      return;
    });
    return;
  });
  return tags;
}