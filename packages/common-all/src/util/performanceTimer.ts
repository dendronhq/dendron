import * as _ from "lodash";
import { milliseconds } from "../timing";

/**
 *  Performance timer utility class to make it easier to quickly add performance
 *  logging to code without having to add lots of variables to track timing state.
 *
 *  Usage example:
 *  const pt = PerformanceTimer();
 *
 *  pt.before('someFunc');
 *  someFunc();
 *  pt.after('someFunc');
 *
 *  pt.before('someOtherFunc');
 *  someOtherFunc();
 *  pt.after('someOtherFunc');
 *
 *  log.info({msg: pt.report()});
 *  */
export class PerformanceTimer {
  /** Before stamps in milliseconds. */
  private readonly beforeStampsMillis: Map<string, number>;
  private readonly timingsMillis: Map<string, number>;
  private readonly errors: string[];
  private readonly opts?: { timerName: string };

  constructor(opts?: { timerName: string }) {
    this.opts = opts;
    this.beforeStampsMillis = new Map<string, number>();
    this.timingsMillis = new Map<string, number>();
    this.errors = [];
  }

  before(name: string) {
    if (this.beforeStampsMillis.has(name)) {
      this.errors.push(`Duplicate before() called with name='${name}'`);
    } else {
      this.beforeStampsMillis.set(name, milliseconds());
    }
  }

  after(name: string) {
    const now = milliseconds();

    const beforeStamp = this.beforeStampsMillis.get(name);
    // Before stamp should always be a non-zero millis value if we have
    // already called before() for the given name.
    if (beforeStamp) {
      if (this.timingsMillis.has(name)) {
        this.errors.push(`Duplicate recording of finishing name='${name}'`);
      } else {
        this.timingsMillis.set(name, now - beforeStamp);
      }
    } else {
      this.errors.push(`Called after() with non existent name='${name}'`);
    }
  }

  report() {
    const report = [];
    if (this.opts?.timerName) {
      report.push(this.opts?.timerName);
    }
    report.push(`Timings:`);
    report.push(
      Array.from(this.timingsMillis.keys())
        .map((name) => `${name}:${this.timingsMillis.get(name)}ms`)
        .join(" | ")
    );
    report.push(
      ` | Total: ${_.sum(Array.from(this.timingsMillis.values()))}ms`
    );
    if (this.errors.length) {
      report.push(`ERRORS FOUND:`);
      report.push(this.errors.join("|"));
    }
    return report.join(" ");
  }
}
