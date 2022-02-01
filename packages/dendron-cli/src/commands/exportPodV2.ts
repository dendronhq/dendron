import {
  DendronError,
  DEngineClient,
  ErrorFactory,
  NoteProps,
  ResponseUtil,
} from "@dendronhq/common-all";
import {
  AirtableExportPodV2,
  AirtableExportReturnType,
  AirtableUtils,
  GoogleDocsExportPodV2,
  GoogleDocsExportReturnType,
  GoogleDocsUtils,
  JSONExportPodV2,
  MarkdownExportPodV2,
  NotionExportPodV2,
  NotionExportReturnType,
  NotionUtils,
  PodV2Types,
} from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { enrichPodArgs, PodCLIOpts, setupPodArgs } from "./podsV2";
import { setupEngineArgs, SetupEngineCLIOpts, SetupEngineResp } from "./utils";
import Airtable from "@dendronhq/airtable";

export { CommandCLIOpts as ExportPodV2CLIOpts };

type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

type CommandOpts = CommandCLIOpts & {
  config: any;
  payload: NoteProps[];
} & SetupEngineResp &
  CommandCommonProps;

type CommandOutput = CommandCommonProps;

export class ExportPodV2CLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "exportPodV2",
      desc: "use a pod to export notes",
    });
  }

  buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    super.buildArgs(args);
    setupEngineArgs(args);
    setupPodArgs(args);
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ podType: args.configValues?.podType });
    return enrichPodArgs(args);
  }

  /**
   * Method to instantiate the pod instance with the
   * passed in configuration
   */
  createPod(config: any, engine: DEngineClient) {
    switch (config.podType) {
      case PodV2Types.MarkdownExportV2:
        return new MarkdownExportPodV2({
          podConfig: config,
          engine,
          dendronConfig: engine.config,
        });
      case PodV2Types.JSONExportV2:
        return new JSONExportPodV2({
          podConfig: config,
        });
      case PodV2Types.AirtableExportV2:
        return new AirtableExportPodV2({
          airtable: new Airtable({ apiKey: config.apiKey }),
          config,
          engine,
        });
      case PodV2Types.NotionExportV2:
        return new NotionExportPodV2({
          podConfig: config,
        });
      case PodV2Types.GoogleDocsExportV2:
        return new GoogleDocsExportPodV2({
          podConfig: config,
          engine,
        });
      default:
        throw new DendronError({
          message: "the requested pod type is not implemented yet",
        });
    }
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "execute";
    const { server, serverSockets, engine, config, payload } = opts;
    const pod = this.createPod(config, engine);
    this.L.info({ ctx, msg: "running pod..." });
    const exportReturnValue = await pod.exportNotes(payload);
    await this.onExportComplete({
      exportReturnValue,
      podType: config.podType,
      engine,
    });
    this.L.info({ ctx, msg: "done execute" });
    return new Promise((resolve) => {
      server.close((err: any) => {
        this.L.info({ ctx, msg: "closing server" });
        // close outstanding connections
        serverSockets?.forEach((socket) => socket.destroy());
        if (err) {
          return resolve({
            error: new DendronError({ message: "error closing", payload: err }),
          });
        }
        resolve({ error: undefined });
      });
    });
  }

  async onExportComplete(opts: {
    exportReturnValue: any;
    podType: PodV2Types;
    engine: DEngineClient;
  }) {
    const { exportReturnValue, podType, engine } = opts;
    switch (podType) {
      case PodV2Types.AirtableExportV2:
        return this.onAirtableExportComplete({ exportReturnValue, engine });
      case PodV2Types.GoogleDocsExportV2:
        return this.onGoogleDocsExportComplete({ exportReturnValue, engine });
      case PodV2Types.NotionExportV2:
        return this.onNotionExportComplete({ exportReturnValue, engine });
    }
  }

  async onAirtableExportComplete(opts: {
    exportReturnValue: AirtableExportReturnType;
    engine: DEngineClient;
  }) {
    const { exportReturnValue, engine } = opts;
    const records = exportReturnValue.data;
    if (ResponseUtil.hasError(exportReturnValue)) {
      console.log(ErrorFactory.safeStringify(exportReturnValue.error));
    }
    if (records?.created) {
      await AirtableUtils.updateAirtableIdForNewlySyncedNotes({
        records: records.created,
        engine,
        logger: this.L,
      });
    }
  }

  async onGoogleDocsExportComplete(opts: {
    exportReturnValue: GoogleDocsExportReturnType;
    engine: DEngineClient;
  }) {
    const { exportReturnValue, engine } = opts;
    if (ResponseUtil.hasError(exportReturnValue)) {
      console.log(ErrorFactory.safeStringify(exportReturnValue.error?.message));
    }
    const createdDocs = exportReturnValue.data?.created?.filter((ent) => !!ent);
    const updatedDocs = exportReturnValue.data?.updated?.filter((ent) => !!ent);
    if (createdDocs) {
      await GoogleDocsUtils.updateNoteWithCustomFrontmatter(
        createdDocs,
        engine
      );
    }
    if (updatedDocs) {
      await GoogleDocsUtils.updateNoteWithCustomFrontmatter(
        updatedDocs,
        engine
      );
    }
  }

  async onNotionExportComplete(opts: {
    exportReturnValue: NotionExportReturnType;
    engine: DEngineClient;
  }) {
    const { exportReturnValue, engine } = opts;
    const { data, error } = exportReturnValue;
    if (ResponseUtil.hasError(exportReturnValue)) {
      console.log(ErrorFactory.safeStringify(error));
    }
    if (data?.created) {
      await NotionUtils.updateNotionIdForNewlyCreatedNotes(
        data.created,
        engine
      );
    }
  }
}
