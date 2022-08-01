import { NoteProps, NotePropsByIdDict } from "@dendronhq/common-all";
import { getNoteUrl } from "../utils/links";
import _ from "lodash";
import Link from "next/link";
import { DateTime } from "luxon";

export function DendronCollectionItem(props: {
  note: NoteProps;
  noteIndex: NoteProps;
}) {
  const { note, noteIndex } = props;
  const href = getNoteUrl({ note, noteIndex });
  let publishedDate: string | undefined;
  try {
    publishedDate = _.get(note, "custom.date", false)
      ? ISO2FormattedDate(note.custom.date, DateTime.DATE_SHORT)
      : millisToFormattedDate(note.created, DateTime.DATE_SHORT);
  } catch (err) {
    throw Error(`no date found for note ${note.id}`);
  }

  return (
    <div>
      <article itemScope itemType="https://schema.org/CreativeWork">
        <h2 itemProp="headline">
          <Link href={href}>{note.title}</Link>
        </h2>
        {!_.isUndefined(publishedDate) && <p>{publishedDate}</p>}
        {_.has(note, "custom.excerpt") && (
          <p itemProp="description">{note.custom.excerpt}</p>
        )}
      </article>
    </div>
  );
}

export function prepChildrenForCollection(
  note: NoteProps,
  notes: NotePropsByIdDict,
) {
  if (note.children.length <= 0) {
    return null;
  }
  let children = note.children.map((id) => notes[id]);
  children = _.sortBy(children, (ent) => {
    if (_.has(ent, "custom.date")) {
      const dt = DateTime.fromISO(ent.custom.date);
      return dt.toMillis();
    }
    return ent.created;
  });
  if (_.get(note, "custom.sort_order", "normal") === "reverse") {
    children = _.reverse(children);
  }
  return children;
}

function ISO2FormattedDate(
  time: string,
  format: Intl.DateTimeFormatOptions,
): string {
  const dt = DateTime.fromISO(time);
  return dt.toLocaleString(format);
}

function millisToFormattedDate(
  ts: number,
  format: Intl.DateTimeFormatOptions,
): string {
  const dt = DateTime.fromMillis(ts);
  return dt.toLocaleString(format);
}
