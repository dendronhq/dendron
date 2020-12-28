import {
  DendronASTDest,
  MDUtilsV4,
  RemarkChangeEntry,
  RemarkUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import { CommandOptsV3 } from "./soil";
import { setupEngine } from "./utils";
import throttle from "@jcoreio/async-throttle";

type CommandCLIOpts = {
  wsRoot: string;
  actions: DoctorActions[];
  enginePort?: number;
  query?: string;
  limit?: number;
};

type CommandOpts = CommandOptsV3 & CommandCLIOpts;
type CommandOutput = void;

export enum DoctorActions {
  H1_TO_TITLE = "h1ToTitle",
  HI_TO_H2 = "h1ToH2",
}

export class DoctorCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "doctor", desc: "doctor helps you fix your notes" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("actions", {
      describe: "what actions the doctor should take",
      requiresArg: true,
      type: "array",
      choices: Object.values(DoctorActions),
    });
    args.option("enginePort", {
      describe: "port that engine is running on",
    });
    args.option("query", {
      describe: "run doctor over a query",
      type: "string",
    });
    args.option("limit", {
      describe: "limit num changes",
      type: "number",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { actions, engine, query, limit } = _.defaults(opts, {
      limit: 99999,
    });
    const proc = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_DENDRON,
      engine,
      mathOpts: { katex: true },
    });
    let notes = query
      ? engine.queryNotesSync({ qs: query }).data
      : _.values(engine.notes);
    this.L.info({ msg: "prep doctor", numResults: notes.length });
    let numChanges = 0;
    let notesSeeked = 0;
    await _.reduce<any, Promise<any>>(
      actions,
      async (acc, action) => {
        await acc;
        switch (action) {
          case DoctorActions.H1_TO_TITLE: {
            return Promise.all(
              notes.map(async (note) => {
                this.L.info({ msg: `processing ${note.fname}` });
                let changes: RemarkChangeEntry[] = [];
                const newBody = await proc()
                  .use(RemarkUtils.h1ToTitle(note, changes))
                  .process(note.body);
                note.body = newBody.toString();
                this.L.info({ msg: `changes ${note.fname}`, changes });
                return;
              })
            );
          }
          case DoctorActions.HI_TO_H2: {
            const engineWrite = throttle(
              _.bind(engine.writeNote, engine),
              5000,
              { leading: true }
            );
            return _.reduce<any, Promise<any>>(
              notes,
              async (accInner, note) => {
                await accInner;
                if (numChanges >= limit) {
                  return;
                }
                this.L.debug({ msg: `processing for h1_to_h2 ${note.fname}` });
                let changes: RemarkChangeEntry[] = [];
                const newBody = await proc()
                  .use(RemarkUtils.h1ToH2(changes))
                  .process(note.body);
                note.body = newBody.toString();
                if (!_.isEmpty(changes)) {
                  await engineWrite(note);
                  this.L.info({ msg: `changes ${note.fname}`, changes });
                  numChanges += 1;
                  return;
                } else {
                  return;
                }
              },
              Promise.resolve()
            );
          }
        }
        return;
      },
      Promise.resolve()
    );
    this.L.info({ msg: "doctor done", numChanges });
    return;
  }
}

// export class DoctorCommand extends SoilCommandV3<
//   CommandCLIOpts,
//   CommandOpts,
//   CommandOutput
// > {

//   static buildCmd(yargs: yargs.Argv): yargs.Argv {
//     const _cmd = new DoctorCommand();
//     return yargs.command(
//       "doctor",
//       "run doctor command",
//       _cmd.buildArgs,
//       _cmd.eval
//     );
//   }

//   buildArgs(args: yargs.Argv) {
//     super.buildArgs(args);
//     args.option("actions", {
//       describe: "what actions the doctor should take",
//       requiresArg: true,
//       type: "array",
//       choices: ["h1ToTitle", "otherAction"]
//     });
//     args.option("enginePort", {
//       describe: "port that engine is running on"
//     });
//   }

//   async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
//     console.log("setupengine pre");
//     const engineArgs = await setupEngine(args);
//     console.log("setupengine post");
//     return { ...args, ...engineArgs };
//   }

//   async execute(opts: CommandOpts) {
//     console.log("engine init");
//     const { actions, engine } = opts;
//     const proc = MDUtilsV4.procFull({
//       dest: DendronASTDest.MD_DENDRON,
//       engine,
//       mathOpts: { katex: true }
//     });
//     await _.reduce<any, Promise<any>>(
//       actions,
//       async (acc, action) => {
//         await acc;
//         if (action === DoctorActions.H1_TO_TITLE) {
//           return Promise.all(
//             _.values(engine.notes).map(async note => {
//               const newBody = await proc()
//                 .use(RemarkUtils.h1ToTitle(note))
//                 .process(note.body);
//               note.body = newBody.toString();
//               await engine.writeNote(note, { updateExisting: true });
//               return;
//             })
//           );
//         }
//         return;
//       },
//       Promise.resolve()
//     );
//     return;
//   }
// }
