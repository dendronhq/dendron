import {
  assertUnreachable,
  DendronError,
  DEngineClient,
  DVault,
  NoteLookupUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { MarkdownPublishPod } from "@dendronhq/pods-core";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  enginePort?: number;
  query?: string;
  cmd: NoteCommands;
  output: NoteCLIOutput;
  destFname?: string;
  destVaultName?: string;
};

export enum NoteCLIOutput {
  JSON = "json",
  MARKDOWN_GFM = "md_gfm",
  MARKDOWN_DENDRON = "md_dendron",
}

type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;

type CommandOutput = { data: any; error?: DendronError };

export enum NoteCommands {
  LOOKUP_V2 = "lookupv2",
  LOOKUP = "lookup",
  DELETE = "delete",
  MOVE = "move",
}

export { CommandOpts as NoteCLICommandOpts };

function checkQuery(opts: CommandOpts) {
  if (_.isUndefined(opts.query)) {
    throw Error("no query found");
  }
  return { query: opts.query };
}

function checkQueryAndVault(opts: CommandOpts) {
  const vaults = opts.engine.vaults;
  let vault: DVault;
  const { query } = checkQuery(opts);
  if (_.size(opts.engine.vaults) > 1 && !opts.vault) {
    throw Error("need to specify vault");
  } else {
    vault = opts.vault
      ? VaultUtils.getVaultByNameOrThrow({ vaults, vname: opts.vault })
      : vaults[0];
  }
  return { query, vault };
}

async function formatNotes({
  output,
  notes,
  engine,
}: {
  output: NoteCLIOutput;
  notes: NoteProps[];
  engine: DEngineClient;
}) {
  const resp = await Promise.all(
    _.map(notes, (note) => {
      return formatNote({ note, output, engine });
    })
  );
  if (output === NoteCLIOutput.JSON) {
    return JSON.stringify(resp, null, 4);
  }
  return resp.join("\n");
}

async function formatNote({
  output,
  note,
  engine,
}: {
  output: NoteCLIOutput;
  note: NoteProps;
  engine: DEngineClient;
}): Promise<string | NoteProps> {
  let payload: string | NoteProps;
  switch (output) {
    case NoteCLIOutput.JSON:
      // this is a NOP
      payload = note;
      break;
    case NoteCLIOutput.MARKDOWN_DENDRON:
      payload = NoteUtils.serialize(note);
      break;
    case NoteCLIOutput.MARKDOWN_GFM:
      payload = await new MarkdownPublishPod().execute({
        engine,
        vaults: engine.vaults,
        wsRoot: engine.wsRoot,
        config: {
          fname: note.fname,
          vaultName: VaultUtils.getName(note.vault),
          dest: "stdout",
        },
      });
      break;
    case undefined:
      throw new DendronError({
        message: "Unknown output format requested",
        payload: {
          ctx: "NoteCLICommand.execute",
          output,
        },
      });
    default:
      assertUnreachable(output);
  }
  return payload;
}

export class NoteCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "note <cmd>", desc: "note related commands" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(NoteCommands),
      type: "string",
    });
    args.option("query", {
      describe: "the query to run",
      type: "string",
    });
    args.option("output", {
      describe: "format to output in",
      type: "string",
      choices: Object.values(NoteCLIOutput),
      default: NoteCLIOutput.JSON,
    });
    args.option("destFname", {
      describe: "name to change to (for move)",
      type: "string",
    });
    args.option("destVaultName", {
      describe: "vault to move to (for move)",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ cmd: args.cmd, output: args.output });
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts) {
    const { cmd, engine, output, destFname, destVaultName } = opts;

    try {
      switch (cmd) {
        case NoteCommands.LOOKUP_V2: {
          const { query } = checkQuery(opts);
          const notes = await NoteLookupUtils.lookup({ qsRaw: query, engine });
          const resp = await formatNotes({
            output: output || NoteCLIOutput.JSON,
            notes,
            engine,
          });
          this.print(resp);
          return { data: { payload: resp, rawData: resp } };
        }
        case NoteCommands.LOOKUP: {
          const { query, vault } = checkQueryAndVault(opts);
          const { data } = await engine.getNoteByPath({
            npath: query,
            createIfNew: true,
            vault,
          });
          let payload: string = "";
          if (data?.note) {
            payload = await formatNote({ engine, note: data.note, output });
            this.print(payload);
          }
          return { data: { payload, rawData: data } };
        }
        case NoteCommands.DELETE: {
          const { query, vault } = checkQueryAndVault(opts);
          const note = NoteUtils.getNoteByFnameFromEngine({
            fname: query,
            vault,
            engine,
          });
          if (note) {
            const resp = await engine.deleteNote(note.id);
            this.print(`deleted ${note.fname}`);
            return { data: { payload: note.fname, rawData: resp } };
          } else {
            throw new DendronError({ message: `note ${query} not found` });
          }
        }
        case NoteCommands.MOVE: {
          const { query, vault } = checkQueryAndVault(opts);
          const note = NoteUtils.getNoteByFnameFromEngine({
            fname: query,
            vault,
            engine,
          });
          if (note) {
            const oldLoc = NoteUtils.toNoteLoc(note);
            const newLoc = {
              fname: destFname || oldLoc.fname,
              vaultName: destVaultName || oldLoc.vaultName,
            };
            const destVault = VaultUtils.getVaultByName({
              vname: destVaultName || oldLoc.fname,
              vaults: engine.vaults,
            });
            const noteExists = NoteUtils.getNoteByFnameFromEngine({
              fname: destFname || query,
              engine,
              vault: destVault || vault,
            });
            const isStub = noteExists?.stub;
            if (noteExists && !isStub) {
              const vaultName = VaultUtils.getName(noteExists.vault);
              const errMsg = `${vaultName}/${query} exists`;
              throw Error(errMsg);
            }
            const resp = await engine.renameNote({ oldLoc, newLoc });
            return { data: { payload: note.fname, rawData: resp } };
          } else {
            throw new DendronError({ message: `note ${query} not found` });
          }
        }
        default: {
          throw Error("bad option");
        }
      }
    } finally {
      if (opts.server.close) {
        opts.server.close();
      }
    }
  }
}
