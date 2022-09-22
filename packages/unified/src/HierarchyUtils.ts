import { NotePropsByIdDict, NotePropsMeta } from "@dendronhq/common-all";
import _ from "lodash";

export class HierarchyUtils {
  /**
   * Get children of current note
   * @param opts.skipLevels: how many levels to skip for child
   * @returns
   */
  static getChildren = (opts: {
    skipLevels: number;
    note: NotePropsMeta;
    notes: NotePropsByIdDict;
  }) => {
    const { skipLevels, note, notes } = opts;
    let children = note.children
      .map((id) => notes[id])
      .filter((ent) => !_.isUndefined(ent));
    let acc = 0;
    while (acc !== skipLevels) {
      children = children
        .flatMap((ent) => ent.children.map((id) => notes[id]))
        .filter((ent) => !_.isUndefined(ent));
      acc += 1;
    }
    return children;
  };
}
