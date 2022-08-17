/* eslint-disable no-console */
import { DLogger } from "@dendronhq/common-all";

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
