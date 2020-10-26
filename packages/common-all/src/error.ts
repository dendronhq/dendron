import { ERROR_CODES } from "./constants";

export class DendronError extends Error {
  public status: string;
  public msg: string;
  public friendly?: string;
  public payload?: string;
  public code?: ERROR_CODES;

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
    this.payload = JSON.stringify(payload || {});
    this.code = code;
  }
}

export class IllegalOperationError extends DendronError {}
