export type DLogger = {
  name?: string;
  level: any;
  debug: (msg: any) => void;
  info: (msg: any) => void;
  error: (msg: any) => void;
};

export class NopLogger {
  public name: string;
  public level: string;
  constructor(opts: { name: string; level: string }) {
    this.name = opts.name;
    this.level = opts.level;
  }

  private _log(msg: any) {
    let ctx = "";
    if (msg.ctx) {
      ctx = msg.ctx;
    }
    // eslint-disable-next-line no-console
    // console.log(this.name, ctx, msg);
  }
  debug = (msg: any) => {
    this._log(msg);
  };
  info = (msg: any) => {
    this._log(msg);
  };
  error = (msg: any) => {
    this._log(msg);
  };
}
