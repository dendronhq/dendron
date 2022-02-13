import {
  assertUnreachable,
  DendronError,
  DVault,
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
  output?: NoteCLIOutput;
  newName?: string;
  newVault?: string;
};

export enum NoteCLIOutput {
  JSON = "json",
  MARKDOWN_GFM = "md_gfm",
  MARKDOWN_DENDRON = "md_dendron",
}

type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;

type CommandOutput = { data: any; error?: DendronError };

export enum NoteCommands {
  LOOKUP = "lookup",
  DELETE = "delete",
  MOVE = "move",
  RENAME = "rename",
}

export { CommandOpts as NoteCLICommandOpts };

function checkQueryAndVault(opts: CommandOpts) {
  const vaults = opts.engine.vaults;
  let vault: DVault;
  if (!opts.query) {
    throw Error("no query found");
  }
  if (_.size(opts.engine.vaults) > 1 && !opts.vault) {
    throw Error("need to specify vault");
  } else {
    vault = opts.vault
      ? VaultUtils.getVaultByNameOrThrow({ vaults, vname: opts.vault })
      : vaults[0];
  }
  return { query: opts.query, vault };
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
    args.option("newName", {
      describe: "name to change to (for rename/move)",
      type: "string",
    });
    args.option("newVault", {
      describe: "vault to move to (for rename/move)",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ cmd: args.cmd, output: args.output });
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts) {
    const { cmd, engine, wsRoot, output, newName, newVault } = opts;

    try {
      switch (cmd) {
        case NoteCommands.LOOKUP: {
          const { query, vault } = checkQueryAndVault(opts);
          const { data } = await engine.getNoteByPath({
            npath: query,
            createIfNew: true,
            vault,
          });
          let payload: string;

          switch (output) {
            case NoteCLIOutput.JSON:
              payload = JSON.stringify(data, null, 4);
              break;
            case NoteCLIOutput.MARKDOWN_DENDRON:
              payload = NoteUtils.serialize(data?.note!);
              break;
            case NoteCLIOutput.MARKDOWN_GFM:
              payload = await new MarkdownPublishPod().execute({
                engine,
                vaults: engine.vaults,
                wsRoot,
                config: {
                  fname: data?.note?.fname!,
                  vaultName: VaultUtils.getName(vault),
                  dest: "stdout",
                },
              });
              break;
            case undefined:
              throw new DendronError({
                message: "Unknown output format requested",
                payload: {
                  ctx: "NoteCLICommand.execute",
                  cmd,
                  output,
                },
              });
            default:
              assertUnreachable(output);
          }

          this.print(payload);
          return { data: { payload, rawData: data } };
        }
        case NoteCommands.DELETE: {
          const { query, vault } = checkQueryAndVault(opts);
          const note = NoteUtils.getNoteOrThrow({
            fname: query,
            notes: engine.notes,
            vault,
            wsRoot,
          });
          const resp = await engine.deleteNote(note.id);
          this.print(`deleted ${note.fname}`);
          return { data: { payload: note.fname, rawData: resp } };
        }
        case NoteCommands.MOVE:
        case NoteCommands.RENAME: {
          const { query, vault } = checkQueryAndVault(opts);
          const note = NoteUtils.getNoteOrThrow({
            fname: query,
            notes: engine.notes,
            vault,
            wsRoot,
          });
          const oldLoc = NoteUtils.toNoteLoc(note);
          const newLoc = {
            fname: newName || oldLoc.fname,
            vaultName: newVault || oldLoc.vaultName,
          };
          const resp = await engine.renameNote({ oldLoc, newLoc });
          return { data: { payload: note.fname, rawData: resp } };
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
