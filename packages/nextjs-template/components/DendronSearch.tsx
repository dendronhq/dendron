import {
  NoteIndexProps,
  NoteLookupUtils,
  NoteProps,
} from "@dendronhq/common-all";
import { LoadingStatus } from "@dendronhq/common-frontend";
import { AutoComplete, Alert, Row, Col, Typography, Divider } from "antd";
import React, { useEffect, useMemo } from "react";
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
import { useDendronLookup, useNoteActive, useNoteBodies } from "../utils/hooks";
import FileTextOutlined from "@ant-design/icons/lib/icons/FileTextOutlined";

/** For notes where nothing in the note body matches, only show this many characters for the note body snippet. */
const MAX_NOTE_SNIPPET_LENGTH = 30;
/** For each matching part in the note body, show this many characters before and after the matching part in each snippet. */
const NOTE_SNIPPET_BEFORE_AFTER = 100;
/** Place this in place of omitted text in between snippet parts. */
const OMITTED_PART_TEXT = " ... ";
/** How long to wait for before triggering fuse search, in ms. Required for performance reasons since fuse search is expensive. */
const SEARCH_DELAY = 300;

export function DendronSearch(props: DendronCommonProps) {
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

  return <DendronSearchComponent {...props} />;
}

type SearchResults = Fuse.FuseResult<NoteProps>[] | undefined;

function DendronSearchComponent(props: DendronPageWithNoteDataProps) {
  const { noteIndex, notes, dendronRouter } = props;

  const [searchResults, setSearchResults] =
    React.useState<SearchResults>(undefined);
  const [lookupResults, setLookupResults] = React.useState<NoteIndexProps[]>(
    []
  );
  const [results, setResults] =
    React.useState<"searchResults" | "lookupResults">();
  const dispatch = useCombinedDispatch();
  const { noteBodies, requestNotes } = useNoteBodies();
  const lookup = useDendronLookup();
  const result = useFetchFuse(props.notes);
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  const initValue = noteActive?.fname || "";
  const [value, setValue] = React.useState(initValue);

  const { fuse, error, loading } = result;

  const debouncedValue = useMemo(
    () =>
      _.debounce(
        () => setSearchResults(() => fuse?.search(value.substring(1))),
        SEARCH_DELAY
      ),
    [fuse, value]
  );

  useEffect(() => {
    requestNotes(searchResults?.map(({ item: note }) => note.id) || []);
  }, [requestNotes, searchResults]);

  useEffect(() => {
    if (value?.startsWith("?")) {
      setResults("searchResults");
    } else {
      setResults("lookupResults");
    }
  }, [value]);

  const onLookup = (qs: string) => {
    if (_.isUndefined(qs)) {
      return;
    }
    const out =
      qs === ""
        ? NoteLookupUtils.fetchRootResults(notes)
        : lookup?.queryNote({ qs });
    setLookupResults(_.isUndefined(out) ? [] : out);
  };

  const onClickLookup = () => {
    const qs = NoteLookupUtils.getQsForCurrentLevel(initValue);
    onLookup(qs);
  };

  const onChangeLookup = (val: string) => {
    setValue(val);
    onLookup(val);
  };

  const onChangeSearch = (val: string) => {
    setValue(val);
    debouncedValue();
  };

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
      size="large"
      allowClear
      style={{ width: "100%" }}
      value={value}
      onClick={results === "searchResults" ? () => null : onClickLookup}
      onChange={results === "searchResults" ? onChangeSearch : onChangeLookup}
      onSelect={(_selection, option) => {
        const id = option.key?.toString()!;
        dendronRouter.changeActiveNote(id, { noteIndex });
        dispatch(
          browserEngineSlice.actions.setLoadingStatus(LoadingStatus.PENDING)
        );
        setValue("");
      }}
      placeholder={
        loading
          ? "Loading Search"
          : "For full text search please use the '?' prefix. e.g. ? Onboarding"
      }
    >
      {results === "searchResults"
        ? searchResults?.map(({ item: note, matches }) => {
            return (
              <AutoComplete.Option key={note.id} value={note.fname}>
                <Row justify="center" align="middle">
                  <Col xs={0} md={1}>
                    <div style={{ position: "relative", top: -12, left: 0 }}>
                      <FileTextOutlined style={{ color: "#43B02A" }} />
                    </div>
                  </Col>
                  <Col
                    xs={24}
                    sm={24}
                    md={11}
                    lg={11}
                    style={{ borderRight: "1px solid #d4dadf" }}
                  >
                    <Row>
                      <Typography.Text>
                        <MatchTitle matches={matches} note={note} />
                      </Typography.Text>
                    </Row>
                    <Row>
                      <Typography.Text type="secondary" ellipsis>
                        {note.fname}
                      </Typography.Text>
                    </Row>
                  </Col>
                  <Col
                    className="gutter-row"
                    xs={24}
                    sm={24}
                    md={11}
                    lg={11}
                    offset={1}
                  >
                    <Row>
                      <MatchBody
                        matches={matches}
                        id={note.id}
                        noteBodies={noteBodies}
                      />
                    </Row>
                  </Col>
                </Row>
              </AutoComplete.Option>
            );
          })
        : lookupResults.map((noteIndex: NoteIndexProps) => {
            return (
              <AutoComplete.Option key={noteIndex.id} value={noteIndex.fname}>
                <div>{noteIndex.fname}</div>
              </AutoComplete.Option>
            );
          })}
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
    .flatMap((match) => match.indices)
    .sort(
      // Sort from earliest to latest match
      ([leftStart, _leftEnd], [rightStart, _rightEnd]) => leftStart - rightStart
    );

  let lastIndex = 0;
  const renderedTitle: (String | JSX.Element)[] = [];
  for (const [startIndex, endIndex] of titleMatches) {
    // Add the part before the match as regular text
    renderedTitle.push(title.slice(lastIndex, startIndex));
    // Add the matched part as bold
    renderedTitle.push(
      <span
        key={`${props.note.id}-${startIndex}-${endIndex}`}
        style={{ fontWeight: "bolder" }}
      >
        {title.slice(startIndex, endIndex + 1)}
      </span>
    );
    lastIndex = endIndex + 1;
  }
  // Add anything after the matches
  renderedTitle.push(title.slice(lastIndex, undefined));

  return <>{renderedTitle}</>;
}

/** Removes repeating newlines from the text. */
function cleanWhitespace(text: string) {
  return _.trim(text, "\n").replaceAll(/\n\n/g, "");
}

/** For a fuse.js match on a note, renders snippets from the note **body** with the matched parts highlighted.  */
function MatchBody(props: {
  matches: readonly Fuse.FuseResultMatch[] | undefined;
  id: string;
  noteBodies: { [noteId: string]: string };
}) {
  const body = props.noteBodies[props.id];
  // May happen when note bodies are still loading
  if (_.isUndefined(body))
    return <span style={{ fontWeight: "lighter" }}>{OMITTED_PART_TEXT}</span>;
  // Map happen if the note only matches with title
  if (_.isUndefined(props.matches))
    return <>{body.slice(undefined, MAX_NOTE_SNIPPET_LENGTH)}</>;
  const bodyMatches = props.matches
    // Extract the ranges of body matches
    .filter((match) => match.key === "body")
    .flatMap((match) => match.indices)
    // Sort from longest range to the shortest
    .sort(([lStart, lEnd], [rStart, rEnd]) => rEnd - rStart - (lEnd - lStart));
  if (bodyMatches.length === 0)
    return <>{body.slice(undefined, MAX_NOTE_SNIPPET_LENGTH)}</>;

  const renderedBody: (String | JSX.Element)[] = [];
  // For simplicity, we highlight the longest range only. Otherwise output looks too complicated.
  const [startIndex, endIndex] = bodyMatches[0];

  const beforeStart = _.max([0, startIndex - NOTE_SNIPPET_BEFORE_AFTER])!;

  // Add a ... part at the start, if we are not at the start of the note
  renderedBody.push(<OmittedText after={0} before={beforeStart} body={body} />);
  // Add the part before the match as regular text
  renderedBody.push(cleanWhitespace(body.slice(beforeStart, startIndex)));

  // Add the matched part as bold
  renderedBody.push(
    <span
      key={`${props.id}-${startIndex}-${endIndex}-${beforeStart}`}
      style={{ fontWeight: "bold" }}
    >
      {cleanWhitespace(body.slice(startIndex, endIndex + 1))}
    </span>
  );

  // Add the part after the match as regular text
  const afterEnd = endIndex + 1 + NOTE_SNIPPET_BEFORE_AFTER;
  renderedBody.push(cleanWhitespace(body.slice(endIndex + 1, afterEnd)));

  // Add a ... part at the end, if we're not at the end of the note
  renderedBody.push(
    <OmittedText after={afterEnd} before={body.length} body={body} />
  );

  return (
    <div
      style={{
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        fontSize: "0.8rem",
        marginLeft: "8px",
      }}
    >
      {renderedBody}
    </div>
  );
}

/** Shows a "..." part that replaces the part of text after `after` and before `before`. */
function OmittedText(props: { after: number; before: number; body: string }) {
  const { after, before, body } = props;
  if (before <= after) return null; // sanity check
  if (OMITTED_PART_TEXT.length >= before - after) {
    // If the gap is smaller than the "..." text, just show the text in that gap instead
    return <>{cleanWhitespace(body.slice(before, after))}</>;
  } else {
    // If the gap is bigger, then show the "..." text
    return <span style={{ fontWeight: "lighter" }}>{OMITTED_PART_TEXT}</span>;
  }
}
