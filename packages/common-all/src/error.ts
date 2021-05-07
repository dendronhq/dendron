import { ERROR_SEVERITY } from "./constants";

export type IDendronError = {
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

export class DendronError extends Error implements IDendronError {
  public status?: string;
  public friendly?: string;
  public payload?: string;
  public severity?: ERROR_SEVERITY;
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
  public message: string;
  isComposite = true;

  constructor(errors: IDendronError[]) {
    super("multiple errors");
    this.payload = errors;
    this.message = "multiple errors";
  }
}

export class IllegalOperationError extends DendronError {}

export function stringifyError(err: Error) {
  return JSON.stringify(err, Object.getOwnPropertyNames(err));
}
