import { DendronError, DLink, NoteProps, RespV3 } from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import minimatch from "minimatch";
import { LinkUtils } from "../markdown";

type ExtractPropsCommon = {
  note: NoteProps;
};

type ExtractPropWithFilter = {
  filters: string[];
} & ExtractPropsCommon;

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
  } & ExtractPropsCommon): string | undefined {
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
  } & ExtractPropsCommon): DateTime | undefined {
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
  static extractLinks({ note, filters }: ExtractPropWithFilter): DLink[] {
    let links: DLink[] = note.links;
    filters.map((pattern) => {
      links = links.filter((t) => minimatch(t.value, pattern));
    });
    return links;
  }

  /**
   * Get hashtags from note
   */
  static extractTags({ note, filters }: ExtractPropWithFilter) {
    let links = LinkUtils.findHashTags({ links: note.links });
    filters.map((pattern) => {
      links = links.filter((t) => minimatch(t.value, pattern));
    });
    return links;
  }

  static extractSingleTag({
    note,
    filters,
  }: ExtractPropWithFilter): RespV3<DLink | undefined> {
    const tags = this.extractTags({ note, filters });
    if (tags.length > 1) {
      const error = new DendronError({
        message: `singleTag field has multiple values. note: ${
          note.fname
        }, tags: ${tags.map((ent) => ent.alias).join(", ")}`,
      });
      return { error };
    }
    if (tags.length === 0) {
      return { data: undefined };
    }
    return { data: tags[0] };
  }
}
