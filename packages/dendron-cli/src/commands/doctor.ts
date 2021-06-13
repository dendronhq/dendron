import {
  NoteChangeEntry,
  NoteProps,
  VaultUtils,
  DLink,
  NoteUtils,
  DEngineClient,
} from "@dendronhq/common-all";
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
  /**
   * pass in note candidates directly to
   * limit what notes should be used in the command.
   */
  candidates?: NoteProps[];
  limit?: number;
  dryRun?: boolean;
  /**
   * When set to true, calls process.exit when command is done.
   *
   * This is done for CLI commands to keep the server from running
   * forever. when run from the plugin, we re-use the existing server
   * so we don't want it to exit.
   */
  exit?: boolean;
} & SetupEngineCLIOpts;

type CommandOpts = CommandCLIOpts & SetupEngineOpts;
type CommandOutput = void;

export enum DoctorActions {
  FIX_FRONTMATTER = "fixFrontmatter",
  H1_TO_TITLE = "h1ToTitle",
  HI_TO_H2 = "h1ToH2",
  REMOVE_STUBS = "removeStubs",
  OLD_NOTE_REF_TO_NEW = "oldNoteRefToNew",
  CREATE_MISSING_LINKED_NOTES = "createMissingLinkedNotes",
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

  getWildLinkDestinations(notes: NoteProps[], engine: DEngineClient) {
    const { wsRoot, vaults } = engine;
    let wildWikiLinks: DLink[] = [];
    _.forEach(notes, (note) => {
      const links = note.links;
      if (_.isEmpty(links)) {
        return;
      }
      wildWikiLinks = wildWikiLinks.concat(
        _.filter(links, (link) => {
          if (link.type !== "wiki") {
            return false;
          }
          const destVault = link.to?.vaultName
            ? VaultUtils.getVaultByName({ vaults, vname: link.to.vaultName })!
            : note.vault;
          const noteExists = NoteUtils.getNoteByFnameV5({
            fname: link.to!.fname as string,
            vault: destVault,
            notes: notes,
            wsRoot: wsRoot,
          });
          return !noteExists;
        })
      );
      return true;
    });
    const uniqueCandidates: NoteProps[] = _.map(
      _.uniqBy(wildWikiLinks, "to.fname"),
      (link) => {
        const destVault = link.to?.vaultName
          ? VaultUtils.getVaultByName({ vaults, vname: link.to.vaultName })!
          : VaultUtils.getVaultByName({ vaults, vname: link.from.vaultName! })!;
        return NoteUtils.create({
          fname: link.to!.fname!,
          vault: destVault!,
        });
      }
    );
    return uniqueCandidates;
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { action, engine, query, candidates, limit, dryRun, exit } =
      _.defaults(opts, {
        limit: 99999,
        exit: true,
      });
    let notes: NoteProps[];
    if (_.isUndefined(candidates)) {
      notes = query
        ? engine.queryNotesSync({ qs: query }).data
        : _.values(engine.notes);
    } else {
      console.log(`${candidates.length} candidate(s) were passed`);
      notes = candidates;
    }
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
    let engineGetNoteByPath = dryRun
      ? () => {}
      : throttle(_.bind(engine.getNoteByPath, engine), 300, {
          leading: true,
        });

    let doctorAction: any;
    switch (action) {
      case DoctorActions.FIX_FRONTMATTER: {
        console.log(
          "the CLI currently doesn't support this action. please run this using the plugin"
        );
        process.exit();
      }
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
            this.L.info(
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
            this.L.info({ msg: `changes ${note.fname}`, changes });
            numChanges += 1;
            return;
          } else {
            return;
          }
        };
        break;
      }
      case DoctorActions.CREATE_MISSING_LINKED_NOTES: {
        // this action is disabled for workspace scope for now.
        if (_.isUndefined(candidates)) {
          console.log(
            `doctor ${DoctorActions.CREATE_MISSING_LINKED_NOTES} requires explicitly passing one candidate note.`
          );
          return;
        }
        notes = this.getWildLinkDestinations(notes, engine);
        doctorAction = async (note: NoteProps) => {
          const vname = VaultUtils.getName(note.vault);
          await engineGetNoteByPath({
            npath: note.fname,
            createIfNew: true,
            vault: note.vault,
          });
          console.log(
            `doctor ${DoctorActions.CREATE_MISSING_LINKED_NOTES} ${note.fname} ${vname}`
          );
          numChanges += 1;
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
