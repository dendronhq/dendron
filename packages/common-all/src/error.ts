import { ERROR_SEVERITY } from "./constants";

export type IDendronError = {
  msg: string;
  isComposite: boolean;
  severity?: ERROR_SEVERITY;
  payload?: any;
  /**
   * status messages
   */
  status?: string;
};

export class DendronError extends Error implements IDendronError {
  public status?: string;
  public msg: string;
  public friendly?: string;
  public payload?: string;
  public severity?: ERROR_SEVERITY;
  isComposite = false;

  constructor({
    friendly,
    msg,
    status,
    payload,
    code,
  }: {
    friendly?: string;
    msg?: string;
    status?: string;
    code?: number;
    payload?: any;
  }) {
    super(msg);
    this.status = status || "unknown";
    this.msg = msg || "";
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
  public payload: IDendronError[];
  public msg: string;
  isComposite = true;

  constructor(errors: IDendronError[]) {
    super("multiple errors");
    this.payload = errors;
    this.msg = "multiple errors";
  }
}

export class IllegalOperationError extends DendronError {}

export function stringifyError(err: Error) {
  return JSON.stringify(err, Object.getOwnPropertyNames(err));
}
