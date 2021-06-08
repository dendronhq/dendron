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
import React, { useState, useMemo } from "react";
import { DendronProps } from "../../lib/types";

type AntdCalendarProps = CalendarProps<Moment>;

function toLookup(notes: NoteProps[]): Record<string, NoteProps> {
  const notesLookup = Object.fromEntries(
    notes.map((note) => {
      const maybeDatePortion = NoteUtils.genJournalNoteTitle({
        fname: note.fname,
        journalName: "journal",
      });
      return [maybeDatePortion, note];
    })
  );
  return notesLookup;
}

const { EngineSliceUtils } = engineSlice;

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

  const engineInitialized = EngineSliceUtils.hasInitialized(engine);
  const { notes, vaults } = engine;
  const { noteActive } = ide;

  const [activeDate, groupedDailyNotes] = useMemo(() => {
    if (noteActive && engineInitialized) {
      const currentVault = noteActive?.vault;

      const vaultNotes = _.values(notes).filter(
        (notes) => notes.vault.fsPath === currentVault?.fsPath
      );

      const dailyNotes = vaultNotes.filter(
        (note) => note.fname.startsWith("daily.") // TODO replace "daily." with value from `dendron.dailyJournalDomain`
      );

      // create lookup table for faster search
      const groupedDailyNotes = toLookup(dailyNotes);

      logger.info(groupedDailyNotes);

      const maybeDatePortion = noteActive
        ? NoteUtils.genJournalNoteTitle({
            fname: noteActive.fname,
            journalName: "journal", // TODO use config value `dendron.defaultJournalName`
          })
        : undefined;

      const activeDate =
        maybeDatePortion && groupedDailyNotes[maybeDatePortion]
          ? moment(maybeDatePortion)
          : undefined;

      return [activeDate, groupedDailyNotes];
    }
    return [undefined, {}];
  }, [engineInitialized, noteActive, notes, vaults]);

  // TODO use `useCallback` to preserve identities across renders (immutable props)
  const onSelect: AntdCalendarProps["onSelect"] = (date) => {
    logger.info({ ctx: "onSelect", date });
    const dateKey = date.format(
      currentMode === "month" ? "YYYY-MM-DD" : "YYYY-MM" // TODO use config value `dendron.defaultJournalDateFormat`
    );
    const selectedNote: NoteProps | undefined = groupedDailyNotes[dateKey];

    postVSCodeMessage({
      type: CalendarViewMessageType.onSelect,
      data: {
        id: selectedNote?.id,
        fname: `daily.journal.${date.format("YYYY.MM.DD")}`,
      },
      source: DMessageSource.webClient,
    });
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
