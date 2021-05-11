// import { DVault, NoteProps, NoteUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import { NoteProps } from "packages/common-all/src/types";
import path from "path";
import {
  ExportPod,
  ExportPodPlantOpts,
  // ImportPod,
  // ImportPodConfig,
  ImportPodPlantOpts,
  // PublishPod,
  // PublishPodPlantOpts,
} from "../basev3";

const ID = "dendron.graphviz";

export type GraphvizImportPodPlantOpts = ImportPodPlantOpts;

interface ParentDictionary {
  [childID: string]: string;
}

export class GraphvizExportPod extends ExportPod {
  static id: string = ID;
  static description: string = "export notes in Graphviz DOT format";

  // Dashes are not allowed, so they are removed.
  // Initial numbers mess with rendering, so each entry is prefixed with "note"
  parseText = (s: string) => (s ? `note_${s.split("-").join("")}` : "");

  processNote(
    note: NoteProps,
    connections: string[],
    parentDictionary: ParentDictionary
  ): [string[], ParentDictionary] {
    if (!note) return [connections, parentDictionary];

    let parentConnection: string = "";
    let localConnections: string[] = [
      `${this.parseText(note.id)} [label="${note.title}"]`,
    ];

    // Parent -> Child connection
    const parentID: string | undefined = parentDictionary[note.id];
    if (parentID)
      parentConnection = `${this.parseText(parentID)} -- ${this.parseText(
        note.id
      )}`;

    // Prepare Parent -> Child connection for this note's children
    note.children.forEach((child) => (parentDictionary[child] = note.id));

    // Note -> Linked Notes connections
    note.links.forEach((link) => {
      if (link.to) {
        // If the link is not currently also a child, add it to the links
        // TODO: This logic makes sense, but "to" links don't have an id for some reason
        if (link.to.id && !note.children.includes(link.to.id)) {
          localConnections.push(
            `${this.parseText(note.id)} -- ${this.parseText(
              link.to.id
            )} [style=dotted]`
          );
        }
      }
    });

    if (parentConnection !== "")
      return [
        [...connections, ...localConnections, parentConnection],
        parentDictionary,
      ];
    return [[...connections, ...localConnections], parentDictionary];
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes } = opts;

    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

    const [connections, _] = notes.reduce<[string[], ParentDictionary]>(
      ([previousConnections, previousDictionary], current) => {
        return this.processNote(
          current,
          previousConnections,
          previousDictionary
        );
      },
      [[], {}]
    );

    const gv = `graph {
    ${connections.join(";\n\t")};
}`;

    fs.writeFileSync(podDstPath, gv);
    return { notes };
  }
}
