import type { NoteProps } from "@dendronhq/common-all";
import { LoadingStatus } from "@dendronhq/common-frontend";
import { AutoComplete, Alert } from "antd";
import React from "react";
import { useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import { useFetchFuse } from "../utils/fuse";
import type Fuse from "fuse.js";
import {
  DendronCommonProps,
  DendronPageWithNoteDataProps,
  verifyNoteData,
} from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import _ from "lodash";

/** For matching notes, only show this many characters for the note body snippet. */
const MAX_NOTE_SNIPPET_LENGTH = 80;
/** For each matching part in the note body, show this many characters before and after the matching part in each snippet. */
const NOTE_SNIPPET_BEFORE_AFTER = 10;
/** Place this in place of omitted text in between snippet parts. */
const OMITTED_PART_TEXT = " ... ";

const LOADING_KEY = "__loading";
const LOADING_MESSAGE = "Loading...";

export function DendronSearch(props: DendronCommonProps) {
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

  return <DendronSearchComponent {...props} />;
}

function DendronSearchComponent(props: DendronPageWithNoteDataProps) {
  const dispatch = useCombinedDispatch();
  const { noteIndex, dendronRouter } = props;
  const [value, setValue] = React.useState("");
  const { ensureIndexReady, fuse, error, loading } = useFetchFuse(props.notes);
  if (error) {
    return (
      <Alert
        type="error"
        closable={false}
        message="Error loading data for the search."
      />
    );
  }
  return (
    <AutoComplete
      onClick={ensureIndexReady}
      style={{ width: "100%" }}
      value={value}
      onChange={setValue}
      onSelect={(_selection, option) => {
        const id = option.key?.toString()!;
        dendronRouter.changeActiveNote(id, { noteIndex });
        dispatch(
          browserEngineSlice.actions.setLoadingStatus(LoadingStatus.PENDING)
        );
        setValue("");
      }}
      placeholder="Search"
    >
      {loading ? (
        <AutoComplete.Option key={LOADING_KEY} value={LOADING_MESSAGE} disabled>
          <div>{LOADING_MESSAGE}</div>
        </AutoComplete.Option>
      ) : undefined}
      {fuse
        ? fuse.search(value).map((note) => {
            return (
              <AutoComplete.Option key={note.item.id} value={note.item.fname}>
                <div className="search-option">
                  <MatchTitle matches={note.matches} note={note.item} />
                  <span
                    className="search-fname"
                    style={{ marginLeft: "10px", opacity: 0.7 }}
                  >
                    {note.item.fname}
                  </span>
                  <div className="search-summary">
                    <MatchBody matches={note.matches} note={note.item} />
                  </div>
                </div>
              </AutoComplete.Option>
            );
          })
        : undefined}
    </AutoComplete>
  );
}

/** For a fuse.js match on a note, renders the note **title** with the matched parts highlighted.  */
function MatchTitle(props: {
  matches: readonly Fuse.FuseResultMatch[] | undefined;
  note: NoteProps;
}) {
  const { title } = props.note;
  if (_.isUndefined(props.matches)) return <>{title}</>;
  const titleMatches = props.matches
    .filter((match) => match.key === "title")
    .flatMap((match) => match.indices);

  let lastIndex = 0;
  const renderedTitle: (String | JSX.Element)[] = [];
  for (const [startIndex, endIndex] of titleMatches) {
    // Add the part before the match as regular text
    renderedTitle.push(title.slice(lastIndex, startIndex));
    // Add the matched part as bold
    renderedTitle.push(
      <span style={{ fontWeight: "bold" }}>
        {title.slice(startIndex, endIndex + 1)}
      </span>
    );
    lastIndex = endIndex + 1;
  }
  // Add anything after the matches
  renderedTitle.push(title.slice(lastIndex, undefined));

  return <>{renderedTitle}</>;
}

/** For a fuse.js match on a note, renders snippets from the note **body** with the matched parts highlighted.  */
function MatchBody(props: {
  matches: readonly Fuse.FuseResultMatch[] | undefined;
  note: NoteProps;
}) {
  const { body } = props.note;
  if (_.isUndefined(props.matches))
    return <>{body.slice(undefined, MAX_NOTE_SNIPPET_LENGTH)}</>;
  const bodyMatches = props.matches
    .filter((match) => match.key === "body")
    .flatMap((match) => match.indices);

  let lastIndex = 0;
  const renderedBody: (String | JSX.Element)[] = [];
  bodyMatches.forEach(([startIndex, endIndex], matchIndex) => {
    // Add the part before the match as regular text
    // Don't go further back than last part to avoid duplicating it
    const beforeStart = _.max([
      lastIndex,
      startIndex - NOTE_SNIPPET_BEFORE_AFTER,
    ]);
    renderedBody.push(body.slice(beforeStart, startIndex));
    // Add the matched part as bold
    renderedBody.push(
      <span style={{ fontWeight: "bold" }}>
        {body.slice(startIndex, endIndex + 1)}
      </span>
    );
    // Add the part after the match as regular text
    // Don't go further than next part to avoid duplicating it
    let afterEnd = endIndex + 1 + NOTE_SNIPPET_BEFORE_AFTER;
    const next = bodyMatches[matchIndex + 1];
    if (next && next[0] < afterEnd) afterEnd = next[0];
    renderedBody.push(body.slice(endIndex + 1, afterEnd));

    lastIndex = afterEnd + 1;

    // Add a " ... " if:
    // - there's a following match we're going to add
    // - there's a gap between this and next match
    if (next && next[0] !== afterEnd) {
      if (
        next[0] - NOTE_SNIPPET_BEFORE_AFTER - afterEnd - 1 >
        OMITTED_PART_TEXT.length
      ) {
        // Only add " ... " if the gap is longer than the text of " ... "
        renderedBody.push(
          <span style={{ fontWeight: "lighter" }}>{OMITTED_PART_TEXT}</span>
        );
      } else {
        // Otherwise, add the actual text since it's shorter to just add that
        renderedBody.push(
          body.slice(afterEnd + 1, next[0] - NOTE_SNIPPET_BEFORE_AFTER)
        );
        lastIndex = next[0] - NOTE_SNIPPET_BEFORE_AFTER + 1;
      }
    }
  });

  return <>{renderedBody}</>;
}
