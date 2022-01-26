import { StatusCodes } from "http-status-codes";
import _ from "lodash";
import { AxiosError } from "axios";
import { ERROR_SEVERITY, ERROR_STATUS } from "./constants";

type DendronErrorProps = {
  /**
   * Arbitrary payload
   */
  payload?: any;

  /**
   * See {@link ERROR_SEVERITY}
   */
  severity?: ERROR_SEVERITY;

  /**
   * @deprecated - should only used in DendronServerError
   * Optional HTTP status code for error
   */
  code?: StatusCodes;

  /**
   * @deprecated - should only used in DendronServerError
   * Custom status errors
   */
  status?: string;

  /**
   * Inner Error object
   */
  innerError?: Error;
} & Error;

type ServerErrorProps = {
  /**
   * Custom status errors
   */
  status?: string;

  /**
   * Optional HTTP status code for error
   */
  code?: StatusCodes;
};

export type IDendronError = DendronErrorProps;

export class DendronError extends Error implements IDendronError {
  public status?: string;
  public payload?: string;
  public severity?: ERROR_SEVERITY;
  public code?: number;
  public innerError?: Error;

  static createPlainError(props: Omit<DendronErrorProps, "name">) {
    return error2PlainObject({
      ...props,
      // isComposite: false,
      name: "DendronError",
    });
  }

  static createFromStatus({
    status,
    ...rest
  }: { status: ERROR_STATUS } & Partial<DendronErrorProps>): DendronError {
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
    innerError,
  }: Omit<DendronErrorProps, "name">) {
    super(message);
    this.name = "DendronError";
    this.status = status || "unknown";
    this.severity = severity;
    this.message = message || "";
    if (payload?.message && payload?.stack) {
      this.payload = JSON.stringify({
        msg: payload.message,
        stack: payload.stack,
      });
    } else if (_.isString(payload)) {
      this.payload = payload;
    } else {
      this.payload = JSON.stringify(payload || {});
    }
    this.code = code;
    this.innerError = innerError;
    if (innerError) {
      this.stack = innerError.stack;
    }
  }
}

export class DendronCompositeError extends Error implements IDendronError {
  public payload: DendronErrorProps[];
  public severity?: ERROR_SEVERITY;
  public errors: IDendronError[];

  constructor(errors: IDendronError[]) {
    super();
    this.payload = errors.map((err) => error2PlainObject(err));
    this.errors = errors;

    const hasFatalError =
      _.find(errors, (err) => err.severity === ERROR_SEVERITY.FATAL) !==
      undefined;
    const allMinorErrors =
      _.filter(errors, (err) => err.severity !== ERROR_SEVERITY.MINOR)
        .length === 0;

    if (hasFatalError) {
      // If there is even one fatal error, then the composite is also fatal
      this.severity = ERROR_SEVERITY.FATAL;
    } else if (allMinorErrors) {
      // No fatal errors, and everything is a minor error.
      // The composite can be safely marked as a minor error too.
      this.severity = ERROR_SEVERITY.MINOR;
    }

    // sometimes a composite error can be of size one. unwrap and show regular error message in this case
    if (this.errors.length === 1) {
      this.message = this.errors[0].message;
    } else {
      const out = ["Multiple errors: "];
      const messages = this.errors.map((err) => ` - ${err.message}`);
      this.message = out.concat(messages).join("\n");
    }
  }
}

export class DendronServerError
  extends DendronError
  implements IDendronError, ServerErrorProps
{
  /**
   * Optional HTTP status code for error
   */
  public code?: StatusCodes;

  /**
   * Custom status errors
   */
  public status?: string;
}

export class IllegalOperationError extends DendronError {}

export function stringifyError(err: Error) {
  return JSON.stringify(err, Object.getOwnPropertyNames(err));
}

export const error2PlainObject = (err: IDendronError): DendronErrorProps => {
  const out: Partial<DendronErrorProps> = {};
  Object.getOwnPropertyNames(err).forEach((k) => {
    // @ts-ignore
    out[k] = err[k];
  });
  return out as DendronErrorProps;
};

export class ErrorMessages {
  static formatShouldNeverOccurMsg(description?: string) {
    return `${
      description === undefined ? "" : description + " "
    }This error should never occur! Please report a bug if you have encountered this.`;
  }
}

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
 * ```ts
 * type Names = "bar" | "baz";
 *
 * function foo(name: Names) {
 *   if (name === "bar") { ... }
 *   else if (name === "baz") { ... }
 *   else assertUnreachable(name);
 * }
 * ```
 *
 * Let's say someone changes the type Names to `type Names = "bar" | "baz" | "ham";`. Thanks to this
 * assertion, the compiler will warn them that this branch is now reachable, and something is wrong.
 *
 * Here's another example:
 *
 * ```
 * switch (msg.type) {
 *   case GraphViewMessageType.onSelect:
 *   // ...
 *   // ... all the cases
 *   default:
 *     assertUnreachable(msg.type);
 * }
 * ```
 *
 * Warning! Never use this function without a parameter. It won't actually do any type checks then.
 */
export function assertUnreachable(_never: never): never {
  throw new DendronError({
    message: ErrorMessages.formatShouldNeverOccurMsg(),
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

/** Utility class for helping to correctly construct common errors. */
export class ErrorFactory {
  /**
   * Not found
   */
  static create404Error({ url }: { url: string }): DendronError {
    return new DendronError({
      message: `resource at ${url} does not exist`,
      severity: ERROR_SEVERITY.FATAL,
    });
  }

  static createUnexpectedEventError({ event }: { event: any }): DendronError {
    return new DendronError({
      message: `unexpected event: '${this.safeStringify(event)}'`,
    });
  }

  static createInvalidStateError({
    message,
  }: {
    message: string;
  }): DendronError {
    return new DendronError({
      status: ERROR_STATUS.INVALID_STATE,
      message,
    });
  }

  static createSchemaValidationError({
    message,
  }: {
    message: string;
  }): DendronError {
    return new DendronError({
      message,

      // Setting severity as minor since Dendron could still be functional even
      // if some particular schema is malformed.
      severity: ERROR_SEVERITY.MINOR,
    });
  }

  /** Stringify that will not throw if it fails to stringify
   * (for example: due to circular references)  */
  static safeStringify(obj: any) {
    try {
      return JSON.stringify(obj);
    } catch (exc: any) {
      return `Failed to stringify the given object. Due to '${exc.message}'`;
    }
  }

  /** Wraps the error in DendronError WHEN the instance is not already a DendronError. */
  static wrapIfNeeded(err: any): DendronError {
    if (err instanceof DendronError) {
      // If its already a dendron error we don't need to wrap it.
      return err;
    } else if (err instanceof Error) {
      // If its an instance of some other error we will wrap it and keep track
      // of the inner error which was the cause.
      return new DendronError({
        message: err.message,
        innerError: err,
      });
    } else {
      // Hopefully we aren't reaching this branch but in case someone throws
      // some object that does not inherit from Error we will attempt to
      // safe stringify it into message and wrap as DendronError.
      return new DendronError({
        message: this.safeStringify(err),
      });
    }
  }
}

export class ErrorUtils {
  static isAxiosError(error: unknown): error is AxiosError {
    return _.has(error, "isAxiosError");
  }

  static isDendronError(error: unknown): error is DendronError {
    return _.get(error, "name", "") === "DendronError";
  }
}

export function isTSError(err: any): err is Error {
  return (
    (err as Error).message !== undefined && (err as Error).name !== undefined
  );
}
