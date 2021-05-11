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
