import {
  APIUtils,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  ErrorFactory,
  ERROR_SEVERITY,
  DendronConfig,
  NoteProps,
  ReducedDEngine,
  RespV3,
  VaultUtils,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { AnchorUtils, LinkUtils } from "@dendronhq/unified";

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
   * Recalculate note links and anchors.
   * Modifies note in place
   *
   * NOTE: if the `note.body.length > maxNoteLength`, throw error to client informing them to increase maxNoteLength
   */
  static async refreshNoteLinksAndAnchors({
    note,
    engine,
    config,
    fmChangeOnly,
    silent,
  }: {
    note: NoteProps;
    engine: ReducedDEngine;
    config: DendronConfig;
    fmChangeOnly?: boolean;
    silent?: boolean;
  }): Promise<void> {
    const maxNoteLength = Math.min(
      ConfigUtils.getWorkspace(config).maxNoteLength,
      CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH
    );
    if (note.body.length > maxNoteLength) {
      if (silent) {
        return;
      }
      // this should only show up if a user navigates
      throw new DendronError({
        message:
          `Note "${note.fname}" in vault "${VaultUtils.getName(
            note.vault
          )}" is longer than ${maxNoteLength} characters, some features like backlinks may not work correctly for it. ` +
          `You may increase "maxNoteLength" in "dendron.yml" to override this warning.`,
        severity: ERROR_SEVERITY.MINOR,
      });
    }
    const links = await LinkUtils.findLinks({
      note,
      type: "regular",
      engine,
      config,
    });
    note.links = links;

    if (!fmChangeOnly) {
      const anchors = AnchorUtils.findAnchors({
        note,
      });

      note.anchors = anchors;

      const devConfig = ConfigUtils.getProp(config, "dev");
      const linkCandidatesEnabled = devConfig?.enableLinkCandidates;
      if (linkCandidatesEnabled) {
        const linkCandidates = await LinkUtils.findLinks({
          note,
          type: "candidate",
          engine,
          config,
        });
        note.links = note.links.concat(linkCandidates);
      }
    }
  }
}
