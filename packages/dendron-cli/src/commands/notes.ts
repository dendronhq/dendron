import {
  assertUnreachable,
  DendronError,
  DEngineClient,
  ErrorFactory,
  NoteLookupUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
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
  fname?: string;
  destFname?: string;
  destVaultName?: string;
  newEngine?: boolean;
  body?: string;
};

export enum NoteCLIOutput {
  JSON = "json",
  MARKDOWN_GFM = "md_gfm",
  MARKDOWN_DENDRON = "md_dendron",
}

type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;

type CommandOutput = { data: any; error?: DendronError };

export type NoteCommandData = {
  /**
   * String output
   */
  stringOutput: string;
  notesOutput: NoteProps[];
};

export enum NoteCommands {
  /**
   * Like lookup, but only look for notes.
   * Returns a list of notes
   */
  LOOKUP = "lookup",
  /**
   * Get note by id.
   */
  GET = "get",
  /**
   * Find note by note properties.
   */
  FIND = "find",
  /**
   * Find or create a note. Uses old engineV2/storeV2
   */
  LOOKUP_LEGACY = "lookup_legacy",
  /**
   * Delete note by fname and vault.
   */
  DELETE = "delete",
  /**
   * Move a note to another vault, or rename a note within a workspace.
   */
  MOVE = "move",
  /**
   * Create or update a note by fname and vault.
   */
  WRITE = "write",
}

export { CommandOpts as NoteCLICommandOpts };

function checkQuery(opts: CommandOpts) {
  if (_.isUndefined(opts.query)) {
    throw Error("no query found");
  }
  return opts.query;
}

function checkVault(opts: CommandOpts) {
  const vaults = opts.engine.vaults;
  if (_.size(vaults) > 1 && !opts.vault) {
    throw Error("need to specify vault");
  } else {
    return opts.vault
      ? VaultUtils.getVaultByNameOrThrow({ vaults, vname: opts.vault })
      : vaults[0];
  }
}

function checkFname(opts: CommandOpts) {
  if (_.isUndefined(opts.fname)) {
    throw Error("no fname found");
  }
  return opts.fname;
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
    args.option("fname", {
      describe: "name of file to find/write",
      type: "string",
    });
    args.option("body", {
      describe: "body of file to write",
      type: "string",
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

    // TODO remove after migration to new engine
    if (args.cmd !== NoteCommands.LOOKUP_LEGACY) {
      args.newEngine = true;
    }
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts) {
    const { cmd, engine, output, destFname, destVaultName, body } = _.defaults(
      opts,
      {
        output: NoteCLIOutput.JSON,
      }
    );

    try {
      switch (cmd) {
        case NoteCommands.LOOKUP: {
          const query = checkQuery(opts);
          const notes = await NoteLookupUtils.lookup({ qsRaw: query, engine });
          const resp = await formatNotes({
            output,
            notes,
            engine,
          });
          this.print(resp);
          const data: NoteCommandData = {
            notesOutput: notes,
            stringOutput: resp,
          };
          return { data };
        }
        case NoteCommands.GET: {
          const query = checkQuery(opts);
          const note = await engine.getNote(query);
          if (note.data) {
            const resp = await formatNotes({
              output,
              notes: [note.data],
              engine,
            });
            this.print(resp);
            const data: NoteCommandData = {
              notesOutput: [note.data],
              stringOutput: resp,
            };
            return { data };
          } else {
            return {
              error: ErrorFactory.create404Error({
                url: query,
              }),
              data: undefined,
            };
          }
        }
        case NoteCommands.FIND: {
          const maybeVault = opts.vault
            ? VaultUtils.getVaultByNameOrThrow({
                vaults: engine.vaults,
                vname: opts.vault,
              })
            : undefined;
          const notes = await engine.findNotes({
            fname: opts.fname,
            vault: maybeVault,
          });
          const resp = await formatNotes({
            output,
            notes,
            engine,
          });
          this.print(resp);
          const data: NoteCommandData = {
            notesOutput: notes,
            stringOutput: resp,
          };
          return { data };
        }
        case NoteCommands.LOOKUP_LEGACY: {
          const query = checkQuery(opts);
          const vault = checkVault(opts);
          const notes = await engine.findNotes({ fname: query, vault });
          let note: NoteProps;

          // If note doesn't exist, create note with schema
          if (notes.length === 0) {
            note = await NoteUtils.createWithSchema({
              noteOpts: {
                fname: query,
                vault,
              },
              engine,
            });
            // Until we support user prompt, pick template note for them if there are multiple matches in order of
            // 1. Template note that lies in same vault as note to lookup
            // 2. First note in list
            await TemplateUtils.findAndApplyTemplate({
              note,
              engine,
              pickNote: async (choices: NoteProps[]) => {
                const sameVaultNote = choices.find((ent) => {
                  return VaultUtils.isEqual(vault, ent.vault, engine.wsRoot);
                });
                if (sameVaultNote) {
                  return { data: sameVaultNote };
                } else {
                  return { data: choices[0] };
                }
              },
            });
            const resp = await engine.writeNote(note);
            if (resp.error) {
              return {
                error: ErrorFactory.createInvalidStateError({
                  message: "lookup failed",
                }),
                data: undefined,
              };
            }
          } else {
            note = notes[0];
            // If note exists and its a stub note, delete stub and create new note
            if (note.stub) {
              delete note.stub;
              const resp = await engine.writeNote(note);
              if (resp.error) {
                return {
                  error: ErrorFactory.createInvalidStateError({
                    message: "lookup failed",
                  }),
                  data: undefined,
                };
              }
            }
          }
          const stringOutput = await formatNotes({
            engine,
            notes: [note],
            output,
          });
          this.print(stringOutput);
          return {
            data: {
              notesOutput: [note],
              stringOutput,
            } as NoteCommandData,
          };
        }
        case NoteCommands.WRITE: {
          const fname = checkFname(opts);
          const vault = checkVault(opts);
          const notes = await engine.findNotes({ fname, vault });
          let note: NoteProps;
          let status: string;

          // If note doesn't exist, create new note
          if (notes.length === 0) {
            note = NoteUtils.create({ fname, vault, body });
            status = "CREATE";
          } else {
            // If note exists, update note body
            const newBody = body || "";
            note = { ...notes[0], body: newBody };
            status = "UPDATE";
          }
          const resp = await engine.writeNote(note);
          if (resp.error) {
            return {
              error: ErrorFactory.createInvalidStateError({
                message: `write failed: ${resp.error.message}`,
              }),
              data: undefined,
            };
          } else {
            this.print(`wrote ${note.fname}`);
            return {
              data: { payload: note.fname, rawData: resp, status },
            };
          }
        }
        case NoteCommands.DELETE: {
          const fname = checkFname(opts);
          const vault = checkVault(opts);
          const note = (await engine.findNotes({ fname, vault }))[0];
          if (note) {
            const resp = await engine.deleteNote(note.id);
            if (resp.error) {
              return {
                error: ErrorFactory.createInvalidStateError({
                  message: `delete failed: ${resp.error.message}`,
                }),
                data: undefined,
              };
            } else {
              this.print(`deleted ${note.fname}`);
              return { data: { payload: note.fname, rawData: resp } };
            }
          } else {
            return {
              error: ErrorFactory.createInvalidStateError({
                message: `note ${fname} not found`,
              }),
              data: undefined,
            };
          }
        }
        case NoteCommands.MOVE: {
          const fname = checkFname(opts);
          const vault = checkVault(opts);
          const note = (
            await engine.findNotes({
              fname,
              vault,
            })
          )[0];
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
            const noteExists = (
              await engine.findNotes({
                fname: destFname || fname,
                vault: destVault || vault,
              })
            )[0];
            const isStub = noteExists?.stub;
            if (noteExists && !isStub) {
              const vaultName = VaultUtils.getName(noteExists.vault);
              const errMsg = `${vaultName}/${fname} exists`;
              throw Error(errMsg);
            }
            const resp = await engine.renameNote({ oldLoc, newLoc });
            return { data: { payload: note.fname, rawData: resp } };
          } else {
            throw new DendronError({ message: `note ${fname} not found` });
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
