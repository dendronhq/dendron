export class DendronError extends Error {
  public status: string;
  public msg: string;
  public friendly?: string;
  public payload?: string;

  constructor({
    friendly,
    msg,
    status,
    payload,
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
  }
}

export class IllegalOperationError extends DendronError {}
