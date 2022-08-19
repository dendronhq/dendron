/* eslint-disable no-console */
export type DLogger = {
  name?: string;
  level: any;
  debug: (msg: any) => void;
  info: (msg: any) => void;
  error: (msg: any) => void;
};

/**
 * A simple DLogger implementation that just logs to console. This logger works
 * on all platforms.
 */
export class ConsoleLogger implements DLogger {
  name?: string | undefined;
  level: any;
  debug(msg: any): void {
    console.log(`DEBUG: ${msg}`);
  }
  info(msg: any): void {
    console.log(`INFO: ${msg}`);
  }
  error(msg: any): void {
    console.log(`ERROR: ${msg}`);
  }
}
