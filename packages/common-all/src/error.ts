import { ERROR_SEVERITY } from "./constants";

export type DendronErrorPlainObj = {
  name: string;
  message: string;
  isComposite: boolean;
  severity?: ERROR_SEVERITY;
  payload?: any;
  /**
   * status messages
   */
  status?: string;
};

export type IDendronError = DendronErrorPlainObj & {};

export const error2PlainObject = (err: IDendronError): DendronErrorPlainObj => {
  const { name, message, isComposite, severity, payload, status } = err;
  return {
    name,
    isComposite,
    status,
    payload,
    severity,
    message,
  };
};

export class DendronError extends Error implements IDendronError {
  public status?: string;
  public friendly?: string;
  public payload?: string;
  public severity?: ERROR_SEVERITY;
  public message: string;
  isComposite = false;

  constructor({
    friendly,
    message,
    status,
    payload,
    code,
  }: {
    friendly?: string;
    message?: string;
    status?: string;
    code?: number;
    payload?: any;
  }) {
    super(message);
    this.status = status || "unknown";
    this.message = message || "";
    this.friendly = friendly;
    if (payload?.message && payload?.stack) {
      this.payload = JSON.stringify({
        msg: payload.message,
        stack: payload.stack,
      });
    } else {
      this.payload = JSON.stringify(payload || {});
    }
    this.severity = code;
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
