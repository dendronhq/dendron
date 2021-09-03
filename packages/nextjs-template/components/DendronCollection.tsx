import { NoteProps } from "@dendronhq/common-all";
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
    <div className="list__item">
      <article
        className="archive__item"
        itemScope
        itemType="https://schema.org/CreativeWork"
      >
        <h2 className="archive__item-title no_toc" itemProp="headline">
          <Link href={href}>{note.title}</Link>
          {!_.isUndefined(publishedDate) && (
            <p className="page__meta">
              <i className="far fa-clock" aria-hidden="true" />
              {publishedDate}
            </p>
          )}
          {_.has(note, "custom.excerpt") && (
            <p className="archive__item-excerpt" itemProp="description">
              {note.custom.excerpt}
            </p>
          )}
        </h2>
      </article>
    </div>
  );
}

export function prepChildrenForCollection(
  note: NoteProps,
  notes: any,
  noteIndex: NoteProps
) {
  if (note.children.length <= 0) {
    return;
  }
  // console.log({note, notes, noteIndex});
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

function ISO2FormattedDate(time: string, format: Intl.DateTimeFormatOptions) {
  const dt = DateTime.fromISO(time);
  return dt.toLocaleString(format);
}

function millisToJSDate(ts: number) {
  const dt = DateTime.fromMillis(_.toInteger(ts));
  return dt.toJSDate();
}

function millisToFormattedDate(ts: number, format: Intl.DateTimeFormatOptions) {
  const dt = DateTime.fromMillis(ts);
  return dt.toLocaleString(format);
}
