import {
  CalendarViewMessageType,
  DMessageSource,
  NoteProps,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import { CalendarProps as AntdCalendarProps, Spin } from "antd";
import { Badge, ConfigProvider } from "antd";
import generateCalendar from "antd/lib/calendar/generateCalendar";
import classNames from "classnames";
import _ from "lodash";
import type { Moment } from "moment";
import moment from "moment";
import momentGenerateConfig from "rc-picker/lib/generate/moment";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const { notes, config } = engine;
  const { noteActive } = ide;
  const currentVault = noteActive?.vault;

  const maxDots: number = 5;
  const wordsPerDot: number = 250;
  const dailyJournalDomain = config?.journal.dailyDomain;
  const defaultJournalName = config?.journal.name;
  let defaultJournalDateFormat = config?.journal.dateFormat;
  const dayOfWeek = config?.journal.firstDayOfWeek;
  const locale = "en-us";
  if (defaultJournalDateFormat) {
    defaultJournalDateFormat = defaultJournalDateFormat.replace(/dd/, "DD");
  }

  useEffect(() => {
    moment.updateLocale(locale, {
      week: {
        dow: dayOfWeek!,
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
      return getMaybeDatePortion(note, defaultJournalName!);
    });
    return result;
  }, [notes, defaultJournalName, currentVault?.fsPath]);

  const activeDate = useMemo(() => {
    if (noteActive) {
      const maybeDatePortion = getMaybeDatePortion(
        noteActive,
        defaultJournalName!
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
                      "#00adb5" /* color copied from packages/dendron-next-server/assets/themes/dark-theme.less TODO make dependent on active theme */
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

  if (!engineInitialized) {
    return <Spin />;
  }

  const genError = (msg: string) => {
    const suffix = "Please update your dendron.yml configuration";
    return (
      <>
        `{msg} {suffix}`
      </>
    );
  };

  if (engine.config?.journal.dateFormat !== "y.MM.dd") {
    return genError(
      `only "journal.dateFormat:"y.MM.dd" is supported currently`
    );
  }
  if (engine.config?.journal.addBehavior !== "childOfDomain") {
    return genError(
      `only "journal.addBehavior = "childOfDomain" is supported currently`
    );
  }
  if (engine.config?.journal.dailyDomain !== "daily") {
    return genError(
      `only "journal.dailyDomain = "daily" is supported currently`
    );
  }
  if (engine.config?.journal.name !== "journal") {
    return genError(`only "journal.name = "name" is supported currently`);
  }

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

function areEqual(prevProps: DendronProps, nextProps: DendronProps) {
  const logger = createLogger("treeViewContainer");
  const isDiff = _.some([
    // active note changed
    prevProps.ide.noteActive?.id !== nextProps.ide.noteActive?.id,
    // engine initialized for first time
    _.isUndefined(prevProps.engine.notes) ||
      (_.isEmpty(prevProps.engine.notes) && !_.isEmpty(nextProps.engine.notes)),
    // engine just went from pending to loading
    prevProps.engine.loading === "pending" &&
      nextProps.engine.loading === "idle",
  ]);
  logger.info({ state: "areEqual", isDiff, prevProps, nextProps });
  return !isDiff;
}
const CalendarViewContainer = React.memo(CalendarView, areEqual);
export default CalendarViewContainer;
