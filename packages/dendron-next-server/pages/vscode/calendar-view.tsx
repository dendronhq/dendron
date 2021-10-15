import {
  CalendarViewMessageType,
  DMessageSource,
  NoteProps,
  Time,
  configIsAtLeastV3,
  JournalConfig,
  LegacyJournalConfig,
} from "@dendronhq/common-all";
import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import {
  CalendarProps as AntdCalendarProps,
  Spin,
  Button,
  Divider,
  Badge,
  ConfigProvider,
} from "antd";

import generateCalendar from "antd/lib/calendar/generateCalendar";
import classNames from "classnames";
import _ from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import luxonGenerateConfig from "../../lib/luxon";
import { DendronProps } from "../../lib/types";

type DateTime = InstanceType<typeof Time.DateTime>;

const Calendar = generateCalendar<DateTime>(luxonGenerateConfig);

type CalendarProps = AntdCalendarProps<DateTime>;

function isSameYear(date1: DateTime, date2: DateTime) {
  return (
    date1 &&
    date2 &&
    luxonGenerateConfig.getYear(date1) === luxonGenerateConfig.getYear(date2)
  );
}

function isSameMonth(date1: DateTime, date2: DateTime) {
  return (
    isSameYear(date1, date2) &&
    luxonGenerateConfig.getMonth(date1) === luxonGenerateConfig.getMonth(date2)
  );
}

function isSameDate(date1: DateTime, date2: DateTime) {
  return (
    isSameMonth(date1, date2) &&
    luxonGenerateConfig.getDate(date1) === luxonGenerateConfig.getDate(date2)
  );
}

function getMaybeDatePortion({ fname }: NoteProps, journalName: string) {
  const journalIndex = fname.indexOf(journalName);
  return fname.slice(journalIndex + journalName.length + 1);
}

const today = luxonGenerateConfig.getNow();
const { EngineSliceUtils } = engineSlice;

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

  const journalConfig =
    config?.version! >= 3 && config?.workspace
      ? config?.workspace.journal
      : config?.journal;
  const journalDailyDomain = journalConfig?.dailyDomain;
  const journalName = journalConfig?.name;

  // luxon token format lookup https://github.com/moment/luxon/blob/master/docs/formatting.md#table-of-tokens
  let journalDateFormat = journalConfig?.dateFormat;
  const journalMonthDateFormat = "y.MM"; // TODO compute format for currentMode="year" from config

  // Currently luxon does not support setting first day of the week (https://github.com/moment/luxon/issues/373)
  // const dayOfWeek = config?.journal.firstDayOfWeek;
  // const locale = "en-us";

  if (journalDateFormat) {
    // correct possible user mistake that very likely is meant to be day of the month, padded to 2 (dd) and not localized date with abbreviated month (DD)
    journalDateFormat = journalDateFormat.replace(/DD/, "dd");
  }

  const groupedDailyNotes = useMemo(() => {
    const vaultNotes = _.values(notes).filter((notes) => {
      if (currentVault) {
        return notes.vault.fsPath === currentVault?.fsPath;
      }
      return true;
    });

    const dailyNotes = vaultNotes.filter((note) =>
      note.fname.startsWith(`${journalDailyDomain}.${journalName}`)
    );
    const result = _.groupBy(dailyNotes, (note) => {
      return journalName ? getMaybeDatePortion(note, journalName) : undefined;
    });
    return result;
  }, [notes, journalName, journalDailyDomain, currentVault?.fsPath]);

  const activeDate = useMemo(() => {
    if (noteActive && journalName && journalDateFormat) {
      const maybeDatePortion = getMaybeDatePortion(noteActive, journalName);

      if (maybeDatePortion && _.first(groupedDailyNotes[maybeDatePortion])) {
        const dailyDate = Time.DateTime.fromFormat(
          maybeDatePortion,
          journalDateFormat
        );

        const monthlyDate = Time.DateTime.fromFormat(
          maybeDatePortion,
          journalMonthDateFormat
        );

        return dailyDate.isValid
          ? dailyDate
          : monthlyDate.isValid
          ? monthlyDate
          : undefined;
      }

      return undefined;
    }
  }, [noteActive, groupedDailyNotes, journalName, journalDateFormat]);

  const getDateKey = useCallback<
    (date: DateTime, mode?: CalendarProps["mode"]) => string | undefined
  >(
    (date, mode) => {
      const format =
        (mode || activeMode) === "month"
          ? journalDateFormat
          : journalMonthDateFormat;
      return format ? date.toFormat(format) : undefined;
    },
    [activeMode, journalDateFormat]
  );

  const onSelect = useCallback<
    (date: DateTime, mode?: CalendarProps["mode"]) => void
  >(
    (date, mode) => {
      logger.info({ ctx: "onSelect", date });
      const dateKey = getDateKey(date, mode);
      const selectedNote = dateKey
        ? _.first(groupedDailyNotes[dateKey])
        : undefined;

      postVSCodeMessage({
        type: CalendarViewMessageType.onSelect,
        data: {
          id: selectedNote?.id,
          fname: `${journalDailyDomain}.${journalName}.${dateKey}`,
        },
        source: DMessageSource.webClient,
      });
    },
    [groupedDailyNotes, getDateKey, journalDailyDomain, journalName]
  );

  const onPanelChange = useCallback<
    Exclude<CalendarProps["onPanelChange"], undefined>
  >((date, mode) => {
    logger.info({ ctx: "onPanelChange", date, mode });
    setActiveMode(mode);
  }, []);

  const onClickToday = useCallback(() => {
    const mode = "month";
    setActiveMode(mode);
    onSelect(Time.now(), mode);
  }, [onSelect]);

  const dateFullCellRender = useCallback<
    Exclude<CalendarProps["dateFullCellRender"], undefined>
  >(
    (date) => {
      const dateKey = getDateKey(date);
      const dailyNote = dateKey
        ? _.first(groupedDailyNotes[dateKey])
        : undefined;
      const dailyNotes = dailyNote ? [dailyNote] : []; // keeping for case of showing all dailyNotes of day in multi-vault

      const dateCell =
        // multiple daily notes can exist for that day in a mulit-vault setup
        // will only show up when `noteActive` is `undefined`. this happens when opening vscode with no document open
        dailyNotes.map((note, index) => {
          const amount = _.clamp(
            wordsPerDot
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
            {_.padStart(String(luxonGenerateConfig.getDate(date)), 2, "0")}
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

  return (
    <>
      <Calendar
        mode={activeMode}
        onSelect={onSelect}
        onPanelChange={onPanelChange}
        /*
        // @ts-ignore -- `null` initializes ant Calendar into a controlled component whereby it does not render an selected/visible date (today) when `activeDate` is `undefined`*/
        value={activeDate || null}
        dateFullCellRender={dateFullCellRender}
        fullscreen={false}
      />
      <Divider plain style={{ marginTop: 0 }}>
        <Button type="primary" onClick={onClickToday}>
          Today
        </Button>
      </Divider>
    </>
  );
}

function areEqual(prevProps: DendronProps, nextProps: DendronProps) {
  const logger = createLogger("calendarViewContainer");

  const didNotesLengthChanged =
    Object.keys(prevProps.engine.notes || {}).length !==
    Object.keys(nextProps.engine.notes || {}).length;

  const isDiff = _.some([
    // active note changed
    prevProps.ide.noteActive?.id !== nextProps.ide.noteActive?.id,
    // engine initialized for first time
    _.isUndefined(prevProps.engine.notes) || didNotesLengthChanged,
    // engine just went from pending to loading
    prevProps.engine.loading === "pending" &&
      nextProps.engine.loading === "idle",
  ]);
  logger.info({ state: "areEqual", isDiff, prevProps, nextProps });
  return !isDiff;
}
const CalendarViewContainer = React.memo(CalendarView, areEqual);
export default CalendarViewContainer;
