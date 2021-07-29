// from https://github.com/react-component/picker/pull/230

import { DateTime, Info } from "luxon";
import type { GenerateConfig } from "rc-picker/lib/generate";

const weekDayFormatMap = {
  zh_CN: "narrow",
  zh_TW: "narrow",
};

const weekDayLengthMap = {
  en_US: 2,
  en_GB: 2,
};

/**
 * Normalizes part of a moment format string that should
 * not be escaped to a luxon compatible format string.
 *
 * @param part string
 * @returns string
 */
const normalizeFormatPart = (part: string): string =>
  part
    .replace(/Y/g, "y")
    .replace(/D/g, "d")
    .replace(/gg/g, "kk")
    .replace(/Q/g, "q")
    .replace(/([Ww])o/g, "WW");

/**
 * Normalizes a moment compatible format string to a luxon compatible format string
 *
 * @param format string
 * @returns string
 */
const normalizeFormat = (format: string): string =>
  format
    // moment escapes strings contained in brackets
    .split(/[[\]]/)
    .map((part, index) => {
      const shouldEscape = index % 2 > 0;

      return shouldEscape ? part : normalizeFormatPart(part);
    })
    // luxon escapes strings contained in single quotes
    .join("'");

/**
 * Normalizes language tags used to luxon compatible
 * language tags by replacing underscores with hyphen-minus.
 *
 * @param locale string
 * @returns string
 */
const normalizeLocale = (locale: string): string => locale.replace(/_/g, "-");

const generateConfig: GenerateConfig<DateTime> = {
  // get
  getNow: () => DateTime.local(),
  getFixedDate: (string) => DateTime.fromFormat(string, "yyyy-MM-dd"),
  getEndDate: (date) => date.endOf("month"),
  getWeekDay: (date) => date.weekday,
  getYear: (date) => date.year,
  getMonth: (date) => date.month - 1, // getMonth should return 0-11, luxon month returns 1-12
  getDate: (date) => date.day,
  getHour: (date) => date.hour,
  getMinute: (date) => date.minute,
  getSecond: (date) => date.second,

  // set
  addYear: (date, diff) => date.plus({ year: diff }),
  addMonth: (date, diff) => date.plus({ month: diff }),
  addDate: (date, diff) => date.plus({ day: diff }),
  setYear: (date, year) => date.set({ year }),
  setMonth: (date, month) => date.set({ month: month + 1 }), // setMonth month argument is 0-11, luxon months are 1-12
  setDate: (date, day) => date.set({ day }),
  setHour: (date, hour) => date.set({ hour }),
  setMinute: (date, minute) => date.set({ minute }),
  setSecond: (date, second) => date.set({ second }),

  // Compare
  isAfter: (date1, date2) => date1 > date2,
  isValidate: (date) => date.isValid,

  locale: {
    getWeekFirstDate: (locale, date) =>
      date.setLocale(normalizeLocale(locale)).startOf("week"),
    getWeekFirstDay: (locale) =>
      DateTime.local().setLocale(normalizeLocale(locale)).startOf("week")
        .weekday,
    getWeek: (locale, date) =>
      date.setLocale(normalizeLocale(locale)).weekNumber,
    getShortWeekDays: (locale) => {
      const weekdays = Info.weekdays(weekDayFormatMap[locale] || "short", {
        locale: normalizeLocale(locale),
      });

      const shifted = weekdays.map((weekday) =>
        weekday.slice(0, weekDayLengthMap[locale])
      );

      // getShortWeekDays should return weekday labels starting from Sunday.
      // luxon returns them starting from Monday, so we have to shift the results.
      shifted.unshift(shifted.pop() as string);

      return shifted;
    },
    getShortMonths: (locale) =>
      Info.months("short", { locale: normalizeLocale(locale) }),
    format: (locale, date, format) => {
      if (!date || !date.isValid) {
        return null;
      }

      return date
        .setLocale(normalizeLocale(locale))
        .toFormat(normalizeFormat(format));
    },
    parse: (locale, text, formats) => {
      for (let i = 0; i < formats.length; i += 1) {
        const normalizedFormat = normalizeFormat(formats[i]);

        const date = DateTime.fromFormat(text, normalizedFormat, {
          locale: normalizeLocale(locale),
        });

        if (date.isValid) {
          return date;
        }
      }

      return null;
    },
  },
};

export default generateConfig;
