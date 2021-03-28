import { NoteChangeEntry, NoteProps, VaultUtils } from "@dendronhq/common-all";
import {
  DendronASTDest,
  MDUtilsV4,
  RemarkUtils,
} from "@dendronhq/engine-server";
// @ts-ignore
import throttle from "@jcoreio/async-throttle";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import {
  setupEngine,
  setupEngineArgs,
  SetupEngineCLIOpts,
  SetupEngineOpts,
} from "./utils";

type CommandCLIOpts = {
  action: DoctorActions;
  query?: string;
  limit?: number;
  dryRun?: boolean;
  exit?: boolean;
} & SetupEngineCLIOpts;

type CommandOpts = CommandCLIOpts & SetupEngineOpts;
type CommandOutput = void;

export enum DoctorActions {
  H1_TO_TITLE = "h1ToTitle",
  HI_TO_H2 = "h1ToH2",
  REMOVE_STUBS = "removeStubs",
  OLD_NOTE_REF_TO_NEW = "oldNoteRefToNew",
}

export { CommandOpts as DoctorCLICommandOpts };
export class DoctorCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "doctor", desc: "doctor helps you fix your notes" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("action", {
      describe: "what action the doctor should take",
      type: "string",
      requiresArg: true,
      choices: Object.values(DoctorActions),
      // default: DoctorActions.FIX_FM
    });
    args.option("query", {
      describe: "run doctor over a query",
      type: "string",
    });
    args.option("limit", {
      describe: "limit num changes",
      type: "number",
    });
    args.option("dryRun", {
      describe: "dry run",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { action, engine, query, limit, dryRun, exit } = _.defaults(opts, {
      limit: 99999,
      exit: true,
    });
    let notes = query
      ? engine.queryNotesSync({ qs: query }).data
      : _.values(engine.notes);
    notes = notes.filter((n) => !n.stub);
    this.L.info({ msg: "prep doctor", numResults: notes.length });
    let numChanges = 0;
    let engineWrite = dryRun
      ? () => {}
      : throttle(_.bind(engine.writeNote, engine), 300, {
          leading: true,
        });
    let engineDelete = dryRun
      ? () => {}
      : throttle(_.bind(engine.deleteNote, engine), 300, {
          leading: true,
        });

    let doctorAction: any;
    switch (action) {
      case DoctorActions.H1_TO_TITLE: {
        doctorAction = async (note: NoteProps) => {
          let changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.h1ToTitle(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            console.log(`doctor changing ${note.fname}`);
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.HI_TO_H2: {
        doctorAction = async (note: NoteProps) => {
          let changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.h1ToH2(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            console.log(`doctor changing ${note.fname}`);
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.REMOVE_STUBS: {
        doctorAction = async (note: NoteProps) => {
          let changes: NoteChangeEntry[] = [];
          if (_.trim(note.body) === "") {
            changes.push({
              status: "delete",
              note,
            });
          }
          if (!_.isEmpty(changes)) {
            await engineDelete(note);
            const vname = VaultUtils.getName(note.vault);
            console.log(
              `doctor ${DoctorActions.REMOVE_STUBS} ${note.fname} ${vname}`
            );
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.OLD_NOTE_REF_TO_NEW: {
        doctorAction = async (note: NoteProps) => {
          let changes: NoteChangeEntry[] = [];
          const proc = MDUtilsV4.procFull({
            dest: DendronASTDest.MD_DENDRON,
            engine,
            fname: note.fname,
            vault: note.vault,
          });
          const newBody = await proc()
            .use(RemarkUtils.oldNoteRef2NewNoteRef(note, changes))
            .process(note.body);
          note.body = newBody.toString();
          if (!_.isEmpty(changes)) {
            await engineWrite(note, { updateExisting: true });
            console.log(`doctor changing ${note.fname}`);
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
    }
    await _.reduce<any, Promise<any>>(
      notes,
      async (accInner, note) => {
        await accInner;
        if (numChanges >= limit) {
          return;
        }
        this.L.debug({ msg: `processing ${note.fname}` });
        return doctorAction(note);
      },
      Promise.resolve()
    );
    console.log(`doctor fixed ${numChanges} notes`);
    this.L.info({ msg: "doctor done", numChanges });
    if (exit) {
      process.exit();
    }
    return;
  }
}
