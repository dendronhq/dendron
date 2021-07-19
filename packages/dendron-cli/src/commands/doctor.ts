import {
  NoteChangeEntry,
  NoteProps,
  VaultUtils,
  DLink,
  DVault,
  NoteUtils,
  DEngineClient,
} from "@dendronhq/common-all";
import {
  DendronASTDest,
  MDUtilsV4,
  RemarkUtils,
  LinkUtils,
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


          const hasVaultPrefix = LinkUtils.hasVaultPrefix(link);
          let vaultPrefix: DVault | undefined; 
          if (hasVaultPrefix) {
            vaultPrefix = VaultUtils.getVaultByName({
              vaults, 
              vname: link.to!.vaultName!
            });
            if (!vaultPrefix) return false;
          }
          const isMultiVault = vaults.length > 1;
          const noteExists = NoteUtils.getNoteByFnameV5({
            fname: link.to!.fname as string,
            vault: hasVaultPrefix 
              ? vaultPrefix!
              : note.vault,
            notes,
            wsRoot,
          });
          if (hasVaultPrefix) {
            // true: link w/ vault prefix that points to nothing. (candidate for sure)
            // false: link w/ vault prefix that points to a note. (valid link)
            return !noteExists;
          } 

          if (!noteExists) {
            // true: no vault prefix and single vault. (candidate for sure)
            // false: no vault prefix and multi vault. (ambiguous)
            return !isMultiVault;
          } 
          
          // (valid link)
          return false;
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
      notes = candidates;
    }
    notes = notes.filter((n) => !n.stub);
    this.L.info({ msg: "prep doctor", numResults: notes.length });
    let numChanges = 0;
    const engineWrite = dryRun
      ? () => {}
      : throttle(_.bind(engine.writeNote, engine), 300, {
          leading: true,
        });
    const engineDelete = dryRun
      ? () => {}
      : throttle(_.bind(engine.deleteNote, engine), 300, {
          leading: true,
        });
    const engineGetNoteByPath = dryRun
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
        notes = this.getWildLinkDestinations(notes, engine);
        doctorAction = async (note: NoteProps) => {
          await engineGetNoteByPath({
            npath: note.fname,
            createIfNew: true,
            vault: note.vault,
          });
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
    this.L.info({ msg: "doctor done", numChanges });
    if (exit) {
      process.exit();
    }
    return;
  }
}
