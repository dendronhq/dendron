import {
  DendronError,
  DLink,
  ErrorFactory,
  isNumeric,
  NoteProps,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DateTime } from "luxon";
import minimatch from "minimatch";
import { LinkUtils } from "../markdown";

export type NoteMetadataValidationProps = {
  /**
   * If required, will throw error if field is missing
   */
  required?: boolean;
  /**
   * If enabled, will throw error if field is null
   */
  strictNullChecks?: boolean;
};

export type NotemetadataExtractScalarProps = {
  key: string;
} & ExtractPropsCommon;

type ExtractPropsCommon = {
  note: NoteProps;
} & NoteMetadataValidationProps;

type ExtractPropWithFilter = {
  filters: string[];
} & ExtractPropsCommon;

enum NullOrUndefined {
  "UNDEFINED",
  "NULL",
  "NO_UNDEFINED_OR_NULL",
}

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

  static checkIfAllowNullOrUndefind(
    val: any,
    { required, strictNullChecks }: NoteMetadataValidationProps
  ) {
    if (_.isUndefined(val) && !required) {
      return NullOrUndefined.UNDEFINED;
    }
    if (_.isNull(val) && !strictNullChecks) {
      return NullOrUndefined.NULL;
    }
    return NullOrUndefined.NO_UNDEFINED_OR_NULL;
  }

  static checkAndReturnUndefinedOrError(
    val: any,
    props: NoteMetadataValidationProps
  ) {
    if (
      NoteMetadataUtils.checkIfAllowNullOrUndefind(val, props) !==
      NullOrUndefined.NO_UNDEFINED_OR_NULL
    ) {
      return { data: undefined };
    }
    return {
      error: ErrorFactory.createInvalidStateError({
        message: `${val} is wrong type`,
      }),
    };
  }

  /**
   * Extract string metadata from note
   * @returns
   */
  static extractString({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<string | undefined> {
    const val = _.get(note, key);
    if (_.isString(val)) {
      return { data: val };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractNumber({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<number | undefined> {
    const val = _.get(note, key);
    if (_.isNumber(val)) {
      return { data: val };
    }
    if (isNumeric(val)) {
      return { data: parseFloat(val) };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractBoolean({
    note,
    key,
    ...props
  }: NotemetadataExtractScalarProps): RespV3<boolean | undefined> {
    const val = _.get(note, key);
    if (_.isBoolean(val)) {
      return { data: val };
    }
    return NoteMetadataUtils.checkAndReturnUndefinedOrError(val, props);
  }

  static extractDate({
    note,
    key,
  }: NotemetadataExtractScalarProps): RespV3<DateTime | undefined> {
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
