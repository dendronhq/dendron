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
import momentGenerateConfig from "rc-picker/lib/generate/moment";
import { Badge, ConfigProvider } from "antd";

import classNames from "classnames";
import generateCalendar from "antd/lib/calendar/generateCalendar";

import { blue } from "@ant-design/colors";
import type { CalendarProps as AntdCalendarProps } from "antd";
import _ from "lodash";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { DendronProps } from "../../lib/types";

function isSameYear(date1: Moment, date2: Moment) {
  return (
    date1 &&
    date2 &&
    momentGenerateConfig.getYear(date1) === momentGenerateConfig.getYear(date2)
  );
}

function isSameMonth(date1: Moment, date2: Moment) {
  return (
    isSameYear(date1, date2) &&
    momentGenerateConfig.getMonth(date1) ===
      momentGenerateConfig.getMonth(date2)
  );
}

function isSameDate(date1: Moment, date2: Moment) {
  return (
    isSameMonth(date1, date2) &&
    momentGenerateConfig.getDate(date1) === momentGenerateConfig.getDate(date2)
  );
}

function getMaybeDatePortion({ fname }: NoteProps, journalName: string) {
  const journalIndex = fname.indexOf(journalName);
  return fname.slice(journalIndex + journalName.length + 1);
}

const today = momentGenerateConfig.getNow();
const Calendar = generateCalendar<Moment>(momentGenerateConfig);
const { EngineSliceUtils } = engineSlice;

type CalendarProps = AntdCalendarProps<Moment>;

function CalendarView({ engine, ide }: DendronProps) {
  // --- init
  const ctx = "CalendarView";
  const logger = createLogger("calendarView");

  logger.info({
    ctx,
    state: "enter",
  });

  const { getPrefixCls } = React.useContext(ConfigProvider.ConfigContext);

  const [activeMode, setActiveMode] = useState<CalendarProps["mode"]>("month");

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

  const getDateKey = (date: Moment) => {
    return date.format(
      activeMode === "month" ? defaultJournalDateFormat : "y.MM" // TODO compute format for currentMode="year"
    );
  };

  const onSelect = useCallback<Exclude<CalendarProps["onSelect"], undefined>>(
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
    [groupedDailyNotes, getDateKey]
  );

  useEffect(() => {
    if (activeDate) {
      onSelect(activeDate); // trigger `onSelect` when switching month<->year views
    }
  }, [activeMode]);

  const onPanelChange = useCallback<
    Exclude<CalendarProps["onPanelChange"], undefined>
  >((date, mode) => {
    logger.info({ ctx: "onPanelChange", date, mode });
    setActiveMode(mode);
  }, []);

  const dateFullCellRender = useCallback<
    Exclude<CalendarProps["dateFullCellRender"], undefined>
  >(
    (date) => {
      const dateKey = getDateKey(date);
      const dailyNote = _.first(groupedDailyNotes[dateKey]);
      const dailyNotes = dailyNote ? [dailyNote] : []; // keeping for case of showing all dailyNotes of day in multi-vault

      const dateCell =
        // multiple daily notes can exist for that day in a mulit-vault setup
        // will only show up when `noteActive` is `undefined`. this happens when opening vscode with no document open
        dailyNotes.map((note, index) => {
          const amount = _.clamp(
            !!wordsPerDot
              ? Math.floor(note.body.split(/\n| /).length / wordsPerDot) // TODO create test
              : 0,
            0,
            maxDots
          );

          return (
            <div
              key={note.id}
              style={{
                position: "relative",
                top: index * 2 - 6, // space between the day and dots boxes
                // left: index * 1,
              }}
            >
              {_.times(amount, (index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: index * 7, // 7 resutls in a nice visible space between the dots
                  }}
                >
                  <Badge
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
        });

      const prefixCls = getPrefixCls("picker");
      const calendarPrefixCls = `${prefixCls}-calendar`;

      return (
        <div
          className={classNames(
            `${prefixCls}-cell-inner`,
            `${calendarPrefixCls}-date`,
            {
              [`${calendarPrefixCls}-date-today`]: isSameDate(today, date),
            }
          )}
        >
          <div
            className={`${calendarPrefixCls}-date-value`}
            style={{ color: !dailyNote ? "gray" : undefined }}
          >
            {_.padStart(String(momentGenerateConfig.getDate(date)), 2, "0")}
          </div>
          <div className={`${calendarPrefixCls}-date-content`}>{dateCell}</div>
        </div>
      );
    },
    [getDateKey, groupedDailyNotes]
  );

  return (
    <Calendar
      mode={activeMode}
      onSelect={onSelect}
      onPanelChange={onPanelChange}
      value={activeDate}
      dateFullCellRender={dateFullCellRender}
      fullscreen={false}
    />
  );
}

export default CalendarView;
