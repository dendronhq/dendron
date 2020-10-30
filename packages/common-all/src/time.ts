import { DateTime } from "luxon";

export class Time {
  static now() {
    return DateTime.local();
  }
  static DateTime = DateTime;
}
