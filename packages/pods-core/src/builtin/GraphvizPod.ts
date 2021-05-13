import fs from "fs-extra";
import _ from "lodash";
import { DLink, NoteProps, NoteUtils } from "@dendronhq/common-all";
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

  processNote(opts: {
    note: NoteProps;
    notes: NoteProps[];
    connections: string[];
    parentDictionary: ParentDictionary;
    wsRoot: string;
  }): [string[], ParentDictionary] {
    const { note, notes, connections, parentDictionary, wsRoot } = opts;

    if (!note) return [connections, parentDictionary];

    let localConnections: string[] = [
      // Initial node with label
      `${this.parseText(note.id)} [label="${note.title}"]`,
    ];

    // Parent -> Child connection
    const parentID: string | undefined = parentDictionary[note.id];
    if (parentID) {
      localConnections.push(
        `${this.parseText(parentID)} -- ${this.parseText(note.id)}`
      );
    }

    // common-all/src/dnode.ts
    // src/__tests__/pods-core/JSONPod.spec.ts

    // Prepare Parent -> Child connection for this note's children
    note.children.forEach(
      (child: string) => (parentDictionary[child] = note.id)
    );

    // Note -> Linked Notes connections
    note.links.forEach((link: DLink) => {
      if (link.to) {
        // If the link is not currently also a child, add it to the links
        // TODO: This logic makes sense, but "to" links don't have an id for some reason

        const destinationNote = NoteUtils.getNoteByFnameV5({
          fname: link.to!.fname as string,
          vault: note.vault,
          notes: notes,
          wsRoot,
        });

        if (!_.isUndefined(destinationNote)) {
          if (!note.children.includes(destinationNote.id)) {
            localConnections.push(
              `${this.parseText(note.id)} -- ${this.parseText(
                destinationNote.id
              )} [style=dotted]`
            );
          }
        }
      }
    });

    return [[...connections, ...localConnections], parentDictionary];
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes, wsRoot } = opts;

    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));

    const [connections] = notes.reduce<[string[], ParentDictionary]>(
      ([connections, dictionary], note) => {
        return this.processNote({
          note,
          notes,
          connections,
          parentDictionary: dictionary,
          wsRoot,
        });
      },
      [[], {}]
    );

    // Create file output
    const graphvizOutput = `graph {
    ${connections.join(";\n\t")};
}`;

    // Write file
    const filePath = path.join(podDstPath, "graphviz.dot");
    fs.writeFileSync(filePath, graphvizOutput);

    return { notes };
  }
}
