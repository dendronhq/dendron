import {
  APIUtils,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DEngineClient,
  ErrorFactory,
  NoteProps,
  NoteUtils,
  RespV3,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export function openPortFile({ fpath }: { fpath: string }): number {
  return _.toInteger(_.trim(fs.readFileSync(fpath, { encoding: "utf8" })));
}

export class EngineUtils {
  /**
   * Try to discover file for engine port. Will use following heuristic:
   * - look for file for workspace
   * - look for file for CLI
   * @param param0
   */
  static getPortFilePath(opts: { wsRoot: string }): RespV3<string> {
    let portFilePath = EngineUtils.getPortFilePathForWorkspace(opts);
    if (fs.existsSync(portFilePath)) {
      return { data: portFilePath };
    }
    portFilePath = EngineUtils.getPortFilePathForCLI(opts);
    if (fs.existsSync(portFilePath)) {
      return { data: portFilePath };
    }

    return { error: ErrorFactory.create404Error({ url: portFilePath }) };
  }

  static getPortFilePathForTarget({
    wsRoot,
    target,
  }: {
    wsRoot: string;
    target: "workspace" | "cli";
  }) {
    const suffix = target === "cli" ? ".cli" : "";

    const portFile = path.join(wsRoot, CONSTANTS.DENDRON_SERVER_PORT) + suffix;
    return portFile;
  }

  static getPortFilePathForWorkspace({ wsRoot }: { wsRoot: string }) {
    return this.getPortFilePathForTarget({ wsRoot, target: "workspace" });
  }

  static getPortFilePathForCLI({ wsRoot }: { wsRoot: string }) {
    return this.getPortFilePathForTarget({ wsRoot, target: "cli" });
  }

  static getEnginePort(opts: { wsRoot: string }): RespV3<number> {
    const resp = EngineUtils.getPortFilePath(opts);
    if (resp.error) {
      return resp;
    }
    const port = openPortFile({ fpath: resp.data });
    return { data: port };
  }

  static getEnginePortForCLI(opts: { wsRoot: string }) {
    const portFilePath = EngineUtils.getPortFilePathForCLI(opts);
    const port = openPortFile({ fpath: portFilePath });
    return port;
  }

  static getLocalEngineUrl({ port }: { port: number }) {
    return APIUtils.getLocalEndpoint(port);
  }

  static writeEnginePortForCLI(opts: { port: number; wsRoot: string }) {
    const portFilePath = EngineUtils.getPortFilePathForCLI(opts);
    fs.writeFileSync(portFilePath, _.toString(opts.port), { encoding: "utf8" });
  }

  /**
   * NOTE: if the `note.body.length < maxNoteLength`, we will not add any links or anchors to the note
   * @param param0
   * @returns
   */
  static async refreshNoteLinksAndAnchors({
    note,
    engine,
  }: {
    note: NoteProps;
    engine: DEngineClient;
  }) {
    const maxNoteLength = ConfigUtils.getWorkspace(engine.config).maxNoteLength;
    if (
      note.body.length <
      (maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
    ) {
      const links = await engine.getLinks({ note, type: "regular" });
      const anchors = await engine.getAnchors({
        note,
      });
      if (!anchors.data || !links.data)
        throw new DendronError({
          message: "Failed to calculate note anchors",
          payload: {
            note: NoteUtils.toLogObj(note),
            anchorsError: anchors.error,
            linksError: links.error,
          },
        });

      // update links for note
      note.links = links.data;
      note.anchors = anchors.data;

      const devConfig = ConfigUtils.getProp(engine.config, "dev");
      const linkCandidatesEnabled = devConfig?.enableLinkCandidates;
      if (linkCandidatesEnabled) {
        const linkCandidates = await engine.getLinks({
          note,
          type: "candidate",
        });
        if (!linkCandidates.data)
          throw new DendronError({
            message: "Failed to calculate link candidates",
            payload: {
              note: NoteUtils.toLogObj(note),
              anchorsError: anchors.error,
              linksError: links.error,
            },
          });
        note.links = note.links.concat(linkCandidates.data);
      }
      return note;
    }
    return note;
  }
}
