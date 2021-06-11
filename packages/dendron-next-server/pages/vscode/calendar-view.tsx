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
import { Calendar, Badge } from "antd";
import { blue } from "@ant-design/colors";
import type { CalendarProps } from "antd";
import _ from "lodash";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DendronProps } from "../../lib/types";

type AntdCalendarProps = CalendarProps<Moment>;

function getMaybeDatePortion({ fname }: NoteProps, journalName: string) {
  const journalIndex = fname.indexOf(journalName);
  return fname.slice(journalIndex + journalName.length + 1);
}

const { EngineSliceUtils } = engineSlice;

function CalendarView({ engine, ide }: DendronProps) {
  // --- init
  const ctx = "CalendarView";
  const logger = createLogger("calendarView");

  logger.info({
    ctx,
    state: "enter",
  });

  const [currentMode, setCurrentMode] =
    useState<AntdCalendarProps["mode"]>("month");

  const engineInitialized = EngineSliceUtils.hasInitialized(engine);
  const { notes, vaults, config } = engine;
  const { noteActive } = ide;
  const currentVault = noteActive?.vault;

  const maxDots: number = 5;
  const wordsPerDot: number = 250;
  const dailyJournalDomain = "daily"; // TODO replace "daily." with value from `dendron.dailyJournalDomain`
  const defaultJournalName = "journal"; // TODO use config value `dendron.defaultJournalName`
  const defaultJournalDateFormat = "y.MM.DD"; // TODO use config value `dendron.defaultJournalDateFormat`
  const dayOfWeek = config?.dayOfWeek ?? 1;
  const locale = "en-us";

  useEffect(() => {
    moment.updateLocale(locale, {
      week: {
        dow: dayOfWeek,
      },
    });
  }, [dayOfWeek, locale]);

  const groupedDailyNotes = useMemo(() => {
    const vaultNotes = _.values(notes).filter((notes) => {
      if (currentVault) {
        return notes.vault.fsPath === currentVault?.fsPath;
      }
      return true;
    });

    const dailyNotes = vaultNotes.filter((note) =>
      note.fname.startsWith(`${dailyJournalDomain}.`)
    );
    const result = _.groupBy(dailyNotes, (note) => {
      return getMaybeDatePortion(note, defaultJournalName);
    });
    return result;
  }, [notes, defaultJournalName, currentVault?.fsPath]);

  const activeDate = useMemo(() => {
    if (noteActive) {
      const maybeDatePortion = getMaybeDatePortion(
        noteActive,
        defaultJournalName
      );

      return maybeDatePortion && _.first(groupedDailyNotes[maybeDatePortion])
        ? moment(maybeDatePortion, defaultJournalDateFormat)
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
      const selectedNote = _.first(groupedDailyNotes[dateKey]);

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
      const dailyNotes = groupedDailyNotes[dateKey] ?? [];
      return (
        // multiple daily notes can exist for that day in a mulit-vault setup
        // will only show up when `noteActive` is `undefined`. this happens when opening vscode with no document open
        dailyNotes.map((note, index) => {
          const amount = _.clamp(
            !!wordsPerDot
              ? Math.floor(note.body.split(" ").length / wordsPerDot)
              : 0,
            0,
            maxDots
          );

          return (
            <div
              style={{
                position: "relative",
                top: index * 2 - 6, // space between the day and dots boxes
                // left: index * 1,
              }}
            >
              {_.times(amount, (index) => (
                <div
                  style={{
                    position: "absolute",
                    left: index * 7, // 7 resutls in a nice visible space between the dots
                  }}
                >
                  <Badge
                    key={index}
                    className={`${note.fname}`}
                    dot
                    color={
                      "#00adb5" /* color copied from packages/dendron-next-server/assets/themes/dark-theme.less */
                    }
                  />
                </div>
              ))}
            </div>
          );
        })
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
      fullscreen={false}
    />
  );
}

export default CalendarView;
