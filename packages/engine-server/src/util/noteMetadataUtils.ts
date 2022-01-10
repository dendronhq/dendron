import {
  DendronError,
  DLink,
  ErrorFactory,
  isFalsy,
  NoteProps,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import minimatch from "minimatch";
import { LinkUtils } from "../markdown";

type ExtractPropsCommon = {
  note: NoteProps;
  required?: boolean;
};

type ExtractPropWithFilter = {
  filters: string[];
} & ExtractPropsCommon;

export class NoteMetadataUtils {
  /**
   * Return list of strings from links
   * @param links
   */
  static cleanTags(links: DLink[]): string[] {
    return links.map((l) => {
      return l.value.replace(/^tags./, "");
    });
  }

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

  static extractNumber({
    note,
    key,
    required,
  }: {
    key: string;
  } & ExtractPropsCommon): RespV3<number | undefined> {
    const val = _.get(note, key);
    if (_.isNumber(val)) {
      return { data: val };
    }
    if (_.isUndefined(val) && !required) {
      return { data: undefined };
    }
    return {
      error: ErrorFactory.createInvalidStateError({
        message: `${val} is not numeric`,
      }),
    };
  }

  static extractBoolean({
    note,
    key,
  }: {
    key: string;
  } & ExtractPropsCommon): boolean {
    const val = _.get(note, key);
    return !isFalsy(val);
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
   * If field is not found, return empty array
   */
  static extractArray<T>({
    note,
    key,
  }: {
    key: string;
  } & ExtractPropsCommon): T[] | undefined {
    return _.get(note, key, []);
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
  static extractTags({ note, filters }: ExtractPropWithFilter): DLink[] {
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
