import * as vscode from "vscode";
// import { ShowHelpCommand } from "../commands/ShowHelp";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
// import { Logger } from "../logger";
// import { DWorkspace } from "../workspacev2";

export function activate(context: vscode.ExtensionContext) {
  console.log("inside web activate");

  vscode.window.showInformationMessage("Hello World");
  // Logger.configure(context, "debug");
  // require("../_extension").activate(context); // eslint-disable-line global-require
  // return {
  //   DWorkspace,
  //   Logger,
  // };

  _setupCommands({ context });
}

export function deactivate() {
  // require("./_extension").deactivate(); // eslint-disable-line global-require
}

function mockInterface() {
  const foo: IEngineAPIService = {
    trustedWorkspace: false,
    notes: {},
    noteFnames: {},
    wsRoot: "",
    schemas: {},
    links: [],
    vaults: [],
    configRoot: "",
    config: undefined,
    hooks: {
      onCreate: [],
    },
    engineEventEmitter: undefined,
    getNote: function (id: string): Promise<NoteProps | undefined> {
      throw new Error("Function not implemented.");
    },
    findNotes: function (opts: FindNoteOpts): Promise<NoteProps[]> {
      throw new Error("Function not implemented.");
    },
    findNotesMeta: function (opts: FindNoteOpts): Promise<NotePropsMeta[]> {
      throw new Error("Function not implemented.");
    },
    refreshNotes: function (opts: RefreshNotesOpts): Promise<RespV2<void>> {
      throw new Error("Function not implemented.");
    },
    bulkWriteNotes: function (
      opts: BulkWriteNotesOpts
    ): Promise<BulkResp<NoteChangeEntry[]>> {
      throw new Error("Function not implemented.");
    },
    updateNote: function (
      note: NoteProps,
      opts?: EngineUpdateNodesOptsV2 | undefined
    ): Promise<NoteProps> {
      throw new Error("Function not implemented.");
    },
    updateSchema: function (schema: SchemaModuleProps): Promise<void> {
      throw new Error("Function not implemented.");
    },
    writeNote: function (
      note: NoteProps,
      opts?: EngineWriteOptsV2 | undefined
    ): Promise<RespV2<NoteChangeEntry[]>> {
      throw new Error("Function not implemented.");
    },
    writeSchema: function (schema: SchemaModuleProps): Promise<void> {
      throw new Error("Function not implemented.");
    },
    init: function (): Promise<DEngineInitResp> {
      throw new Error("Function not implemented.");
    },
    deleteNote: function (
      id: string,
      opts?: EngineDeleteOpts | undefined
    ): Promise<Required<RespV2<EngineDeleteNotePayload>>> {
      throw new Error("Function not implemented.");
    },
    deleteSchema: function (
      id: string,
      opts?: EngineDeleteOpts | undefined
    ): Promise<DEngineInitResp> {
      throw new Error("Function not implemented.");
    },
    info: function (): Promise<RespV2<EngineInfoResp>> {
      throw new Error("Function not implemented.");
    },
    sync: function (
      opts?: DEngineSyncOpts | undefined
    ): Promise<DEngineInitResp> {
      throw new Error("Function not implemented.");
    },
    getSchema: function (qs: string): Promise<RespV2<SchemaModuleProps>> {
      throw new Error("Function not implemented.");
    },
    querySchema: function (
      qs: string
    ): Promise<Required<RespV2<SchemaModuleProps[]>>> {
      throw new Error("Function not implemented.");
    },
    queryNotes: function (opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>> {
      throw new Error("Function not implemented.");
    },
    queryNotesSync: function ({
      qs,
      originalQS,
      vault,
    }: {
      qs: string;
      originalQS: string;
      vault?: DVault | undefined;
    }): RespV2<NoteProps[]> {
      throw new Error("Function not implemented.");
    },
    renameNote: function (
      opts: RenameNoteOpts
    ): Promise<RespV2<RenameNotePayload>> {
      throw new Error("Function not implemented.");
    },
    renderNote: function (
      opts: RenderNoteOpts
    ): Promise<RespV2<RenderNotePayload>> {
      throw new Error("Function not implemented.");
    },
    getNoteBlocks: function (
      opts: GetNoteBlocksOpts
    ): Promise<GetNoteBlocksPayload> {
      throw new Error("Function not implemented.");
    },
    writeConfig: function (opts: ConfigWriteOpts): Promise<RespV2<void>> {
      throw new Error("Function not implemented.");
    },
    getConfig: function (): Promise<RespV2<IntermediateDendronConfig>> {
      throw new Error("Function not implemented.");
    },
    getDecorations: function (
      opts: GetDecorationsOpts
    ): Promise<GetDecorationsPayload> {
      throw new Error("Function not implemented.");
    },
    getLinks: function (
      opts: Optional<GetLinksRequest, "ws">
    ): Promise<GetNoteLinksPayload> {
      throw new Error("Function not implemented.");
    },
    getAnchors: function (
      opts: GetAnchorsRequest
    ): Promise<GetNoteAnchorsPayload> {
      throw new Error("Function not implemented.");
    },
  };
}

async function _setupCommands({
  context,
}: {
  context: vscode.ExtensionContext;
}) {
  const existingCommands = await vscode.commands.getCommands();

  const COMMANDS = [];
  // const COMMANDS = [ShowHelpCommand];

  // add all commands
  COMMANDS.map((Cmd) => {
    const cmd = new Cmd();

    if (!existingCommands.includes(cmd.key))
      context.subscriptions.push(
        vscode.commands.registerCommand(cmd.key, async (args: any) => {
          await cmd.run(args);
        })
        // sentryReportingCallback(async (args: any) => {
        //   await cmd.run(args);
        // })
      );
  });
}
