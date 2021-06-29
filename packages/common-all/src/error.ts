import _ from "lodash";
import { ERROR_SEVERITY, ERROR_STATUS } from "./constants";

export type DendronErrorProps = {
  name: string;
  /**
   * General message
   */
  message: string;
  /**
   * Arbitrary payload
   */
  payload?: any;
  /**
   * See {@link ERROR_SEVERITY}
   */
  severity?: ERROR_SEVERITY;
  /**
   * Optional HTTP status code for error
   */
  code?: number;
  /**
   * Custom status errors
   */
  status?: string;
  /**
   * Raw Error object
   */
  error?: Error;
};

export type DendronErrorPlainObj = {
  isComposite: boolean;
} & DendronErrorProps;

export type IDendronError = DendronErrorPlainObj;

export class DendronError extends Error implements IDendronError {
  public status?: string;
  public payload?: string;
  public severity?: ERROR_SEVERITY;
  public code?: number;
  public error?: Error;
  public message: string;
  isComposite = false;

  static createPlainError(props: Omit<DendronErrorProps, "name">) {
    return error2PlainObject({
      ...props,
      isComposite: false,
      name: "DendronError",
    });
  }

  static createFromStatus({
    status,
    ...rest
  }: { status: ERROR_STATUS } & Partial<DendronErrorProps>) {
    return new DendronError({
      name: "DendronError",
      message: status,
      status,
      ...rest,
    });
  }

  constructor({
    message,
    status,
    payload,
    severity,
    code,
    error,
  }: Omit<DendronErrorProps, "name">) {
    super(message);
    this.status = status || "unknown";
    this.severity = severity;
    this.message = message || "";
    if (payload?.message && payload?.stack) {
      this.payload = JSON.stringify({
        msg: payload.message,
        stack: payload.stack,
      });
    } else {
      this.payload = JSON.stringify(payload || {});
    }
    this.code = code;
    this.error = error;
  }
}

export class DendronCompositeError extends Error implements IDendronError {
  public payload: DendronErrorPlainObj[];
  public message: string;
  isComposite = true;

  constructor(errors: IDendronError[]) {
    super("multiple errors");
    this.payload = errors.map((err) => error2PlainObject(err));
    this.message = "multiple errors";
  }
}

export class IllegalOperationError extends DendronError {}

export function stringifyError(err: Error) {
  return JSON.stringify(err, Object.getOwnPropertyNames(err));
}

export const error2PlainObject = (err: IDendronError): DendronErrorPlainObj => {
  const out: Partial<DendronErrorPlainObj> = {};
  Object.getOwnPropertyNames(err).forEach((k) => {
    // @ts-ignore
    out[k] = err[k];
  });
  return out as DendronErrorPlainObj;
};

/** Statically ensure that a code path is unreachable using a variable that has been exhaustively used.
 *
 * The use case for this function is that when using a switch or a chain of if/else if statements,
 * this function allows you to ensure that after all possibilities have been already checked, no further
 * possibilities remain. Importantly, this is done statically (i.e. during compilation), so if anyone
 * revises the code in a way that adds expands the possibilities, a compiler error will warn them that
 * they must revise this part of the code as well.
 *
 * An example of how this function may be used is below:
 *
 *     type Names = "bar" | "baz";
 *
 *     function foo(name: Names) {
 *       if (name === "bar") { ... }
 *       else if (name === "baz") { ... }
 *       else assertUnreachable(name);
 *     }
 *
 * Let's say someone changes the type Names to `type Names = "bar" | "baz" | "ham";`. Thanks to this
 * assertion, the compiler will warn them that this branch is now reachable, and something is wrong.
 *
 * @param x
 */
export function assertUnreachable(_never?: never): never {
  throw new DendronError({
    message:
      "This error should never occur! Please report a bug if you have encountered this.",
  });
}

/**
 * Helper function to raise invalid state
 */
export function assertInvalidState(msg: string): never {
  throw new DendronError({
    status: ERROR_STATUS.INVALID_STATE,
    message: msg,
  });
}
