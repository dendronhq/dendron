/* eslint-disable no-console */
import { DLogger } from "@dendronhq/common-all";

/**
 * Simple DLogger implementation that just logs to console. Works universally on
 * all platforms.
 */
export class ConsoleLogger implements DLogger {
  name?: string | undefined;
  level: any;

  debug(msg: any): void {
    console.log(msg);
  }

  info(msg: any): void {
    console.log(msg);
  }

  error(msg: any): void {
    console.log(msg);
  }
}
