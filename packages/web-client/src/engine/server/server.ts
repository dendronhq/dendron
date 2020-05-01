import express, { Application } from "express";
import Engine from "../engine";
import { NodeStore } from "../engine";

export default class Server<TData> {
  private app: Application;
  private engine: Engine<TData>;

  constructor(store: NodeStore<TData>) {
    this.app = express()
    this.engine = new Engine(store);
    this.app.get(
      '/*',
      async (req, res) => res.json(this.engine.query(req.path.slice(1).replace(/%3E/g, ">")))
    );
  }

  public listen() {
    this.app.listen(parseInt(process.env.PORT || "3000"));
  }
}