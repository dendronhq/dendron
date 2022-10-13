import { Database } from "sqlite3";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ShowHelpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.SHOW_HELP.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const db = new Database(":memory:");

    const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
       fname TEXT NOT NULL,
  ) WITHOUT ROWID;
  `;

    db.exec(createTablesSQL, (err) => {
      vscode.window.showErrorMessage(`Error in SQLite: ${err}`);
    });

    vscode.window.showInformationMessage(`Ran something in SQLite`);
  }
}
