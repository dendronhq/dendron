import {
  createLogger,
  engineSlice,
  ideHooks,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import {
  DMessageSource,
  CalendarViewMessageType,
  DNodeUtils,
  NoteUtils,
  NoteProps,
} from "@dendronhq/common-all";
import type { Moment } from "moment";
import moment from "moment";
import { Calendar } from "antd";
import type { CalendarProps } from "antd";
import _ from "lodash";
import React, { useState } from "react";
import { DendronProps } from "../../lib/types";

type AntdCalendarProps = CalendarProps<Moment>;

function toLookup(notes: NoteProps[]): Record<string, NoteProps> {
  const notesLookup = Object.fromEntries(
    notes.map((note) => {
      const dateKey = NoteUtils.genJournalNoteTitle({
        fname: note.fname,
        journalName: "journal",
      });
      return [dateKey, note];
    })
  );
  return notesLookup;
}

function CalendarView({ engine, ide }: DendronProps) {
  // --- init
  const ctx = "CalendarView";
  const logger = createLogger("calendarView");

  logger.info({
    ctx,
    state: "enter",
    engine,
    ide,
  });

  const [currentMode, setCurrentMode] =
    useState<AntdCalendarProps["mode"]>("month");

  const { notes } = engine;
  const { vaults } = engine;
  const { noteActive } = ide;
  const currentVault = 0; // TODO selected correct vault

  const vaultNotes = _.values(notes).filter(
    (notes) => notes.vault.fsPath === vaults?.[currentVault].fsPath
  );

  const dailyNotes = vaultNotes.filter(
    (note) => note.fname.startsWith("daily.") // TODO replace "daily." with value from `dendron.dailyJournalDomain`
  );

  // create lookup table for faster search
  const groupedDailyNotes = toLookup(dailyNotes); // TODO memoize

  const maybeDatePortion = noteActive
    ? NoteUtils.genJournalNoteTitle({
        fname: noteActive.fname,
        journalName: "journal",
      })
    : undefined;

  const activeDate =
    maybeDatePortion && groupedDailyNotes[maybeDatePortion]
      ? moment(maybeDatePortion)
      : undefined;

  const onSelect: AntdCalendarProps["onSelect"] = (date) => {
    logger.info({ ctx: "onSelect", date });
    const dateKey = date.format(
      currentMode === "month" ? "YYYY-MM-DD" : "YYYY-MM"
    );
    const selectedNote = groupedDailyNotes[dateKey];

    if (selectedNote) {
      postVSCodeMessage({
        type: CalendarViewMessageType.onSelect,
        data: { id: selectedNote.id },
        source: DMessageSource.webClient,
      });
    }
  };

  const onPanelChange: AntdCalendarProps["onPanelChange"] = (date, mode) => {
    logger.info({ ctx: "onPanelChange", date, mode });
    setCurrentMode(mode);
  };

  return (
    <Calendar
      mode={currentMode}
      onSelect={onSelect}
      onPanelChange={onPanelChange}
      value={activeDate}
    />
  );
}

export default CalendarView;
