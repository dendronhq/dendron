export class DendronError extends Error {
  constructor(public opts?: { msg?: string; status?: string }) {
    super(opts?.msg);
  }
}

export class IllegalOperationError extends DendronError {}
