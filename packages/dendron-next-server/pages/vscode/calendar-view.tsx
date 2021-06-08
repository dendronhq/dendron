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
import { Calendar, Badge, Space } from "antd";
import { blue } from "@ant-design/colors";
import type { CalendarProps } from "antd";
import _ from "lodash";
import React, { useState, useMemo, useCallback } from "react";
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

  const wordsPerDot: number = 250; // TODO make configurable

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

  const onSelect: AntdCalendarProps["onSelect"] = useCallback(
    (date) => {
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
    },
    [currentMode, groupedDailyNotes]
  );

  const onPanelChange: AntdCalendarProps["onPanelChange"] = useCallback(
    (date, mode) => {
      logger.info({ ctx: "onPanelChange", date, mode });
      setCurrentMode(mode);
    },
    [setCurrentMode]
  );

  const dateCellRender: AntdCalendarProps["dateCellRender"] = useCallback(
    (date) => {
      const dateKey = date.format(
        currentMode === "month" ? "YYYY-MM-DD" : "YYYY-MM" // TODO use config value `dendron.defaultJournalDateFormat`
      );
      const selectedNote: NoteProps | undefined = groupedDailyNotes[dateKey];
      if (selectedNote) {
        return (
          <Space size={0} wrap>
            {_.times(
              _.clamp(
                !!wordsPerDot
                  ? Math.floor(
                      selectedNote.body.split(" ").length / wordsPerDot
                    )
                  : 0,
                0,
                5
              ),
              () => (
                <Badge
                  dot
                  color={
                    "#00adb5" /* color copied from packages/dendron-next-server/assets/themes/dark-theme.less */
                  }
                />
              )
            )}
          </Space>
        );
      }

      return null;
    },
    [groupedDailyNotes, wordsPerDot]
  );

  return (
    <Calendar
      mode={currentMode}
      onSelect={onSelect}
      onPanelChange={onPanelChange}
      value={activeDate}
      dateCellRender={dateCellRender}
    />
  );
}

export default CalendarView;
