export class DendronError extends Error {
  public status: string;
  constructor(public opts?: { msg?: string; status?: string }) {
    super(opts?.msg);
    this.status = opts?.status || "ok";
  }
}

export class IllegalOperationError extends DendronError {}
