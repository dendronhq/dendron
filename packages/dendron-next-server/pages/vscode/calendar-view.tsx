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

function getMaybeDatePortion({ fname }: NoteProps, journalName: string) {
  const journalIndex = fname.indexOf(journalName);
  return fname.slice(journalIndex + journalName.length + 1);
}

function toLookup(
  notes: NoteProps[],
  journalName: string
): Record<string, NoteProps> {
  const notesLookup = Object.fromEntries(
    notes.map((note) => {
      const maybeDatePortion = getMaybeDatePortion(note, journalName);
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

  const maxDots: number = 5;
  const wordsPerDot: number = 250;
  const dailyJournalDomain = "daily"; // TODO replace "daily." with value from `dendron.dailyJournalDomain`
  const defaultJournalName = "journal"; // TODO use config value `dendron.defaultJournalName`
  const defaultJournalDateFormat = "y.MM.DD"; // TODO use config value `dendron.defaultJournalDateFormat`

  const [currentMode, setCurrentMode] =
    useState<AntdCalendarProps["mode"]>("month");

  const engineInitialized = EngineSliceUtils.hasInitialized(engine);
  const { notes, vaults } = engine;
  const { noteActive } = ide;

  // TODO build `groupedDailyNotes` to contain multi-vault daily notes so that it does not get recalculated after changes in `noteActive.vault`
  // this will fix non-visible worddots when opening workspace without active note.
  const groupedDailyNotes = useMemo(() => {
    if (noteActive && engineInitialized) {
      const currentVault = noteActive?.vault;

      const vaultNotes = _.values(notes).filter(
        (notes) => notes.vault.fsPath === currentVault?.fsPath
      );

      const dailyNotes = vaultNotes.filter((note) =>
        note.fname.startsWith(`${dailyJournalDomain}.`)
      );

      return toLookup(dailyNotes, defaultJournalName);
    }
    return {};
  }, [noteActive]);

  const activeDate = useMemo(() => {
    if (noteActive) {
      const maybeDatePortion = getMaybeDatePortion(
        noteActive,
        defaultJournalName
      );

      return maybeDatePortion && groupedDailyNotes[maybeDatePortion]
        ? moment(maybeDatePortion)
        : undefined;
    }
  }, [noteActive, groupedDailyNotes]);

  const getDateKey = useCallback(
    (date: Moment) => {
      return date.format(
        currentMode === "month" ? defaultJournalDateFormat : "y.MM" // TODO compute format for currentMode="year"
      );
    },
    [currentMode, defaultJournalDateFormat]
  );

  const onSelect = useCallback<
    Exclude<AntdCalendarProps["onSelect"], undefined>
  >(
    (date) => {
      logger.info({ ctx: "onSelect", date });
      const dateKey = getDateKey(date);
      const selectedNote: NoteProps | undefined = groupedDailyNotes[dateKey];

      postVSCodeMessage({
        type: CalendarViewMessageType.onSelect,
        data: {
          id: selectedNote?.id,
          fname: `daily.journal.${dateKey}`,
        },
        source: DMessageSource.webClient,
      });
    },
    [currentMode, groupedDailyNotes]
  );

  const onPanelChange = useCallback<
    Exclude<AntdCalendarProps["onPanelChange"], undefined>
  >(
    (date, mode) => {
      logger.info({ ctx: "onPanelChange", date, mode });
      setCurrentMode(mode);
    },
    [setCurrentMode]
  );

  const dateCellRender: AntdCalendarProps["dateCellRender"] = useCallback(
    (date) => {
      const dateKey = getDateKey(date);
      const selectedNote: NoteProps | undefined = groupedDailyNotes[dateKey];
      return (
        <Space size={0} wrap>
          {_.times(
            _.clamp(
              !!wordsPerDot
                ? Math.floor(selectedNote?.body.split(" ").length / wordsPerDot)
                : 0,
              0,
              maxDots
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
