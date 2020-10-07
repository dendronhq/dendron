export class DendronError extends Error {
  public status: string;
  constructor(public opts?: { msg?: string; status?: string; code?: number }) {
    super(opts?.msg);
    this.status = opts?.status || "ok";
  }

  get msg(): string {
    return this.opts?.msg || "";
  }
}

export class IllegalOperationError extends DendronError {}
