import _ from "lodash";
import { DateTime } from "luxon";
import minimatch from "minimatch";
import { DLink, NoteProps } from "@dendronhq/common-all";

type ExtractPropCommon = {
  note: NoteProps;
};

export class NoteMetadataUtils {
  /**
   * Extract string metadata from note
   * @returns
   */
  static extractString({
    note,
    key,
  }: {
    key: string;
  } & ExtractPropCommon): string | undefined {
    const val = _.get(note, key, "");
    if (_.isNull(val)) {
      return "";
    }
    return val.toString();
  }

  static extractDate({
    note,
    key,
  }: {
    key: string;
  } & ExtractPropCommon): DateTime | undefined {
    // TODO: we should validate
    let val = _.get(note, key);
    if (_.isNumber(val)) {
      val = DateTime.fromMillis(val).toLocaleString(DateTime.DATETIME_FULL);
    }
    return val;
  }

  /**
   * Get all links from a note
   */
  static extractLinks({
    note,
    filters,
  }: {
    filters: string[];
  } & ExtractPropCommon): DLink[] {
    let links: DLink[] = note.links;
    filters.map((pattern) => {
      links = links.filter((t) => minimatch(t.value, pattern));
    });
    return links;
  }
}
