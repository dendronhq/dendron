import fs from "fs-extra";
import _ from "lodash";
import { DLink, NoteProps, NoteUtils } from "@dendronhq/common-all";
import path from "path";
import { ExportPod, ExportPodPlantOpts } from "../basev3";
import { ExportPodConfig } from "../basev3";

const ID = "dendron.graphviz";

type ParentDictionary = {
  [childID: string]: string;
};

type GraphvizExportPodCustomOpts = {
  includeHierarchy: boolean;
  includeLinks: boolean;
};

export type GraphvizExportConfig = ExportPodConfig &
  GraphvizExportPodCustomOpts;

type GraphvizExportPodProcessProps = GraphvizExportPodCustomOpts & {
  note: NoteProps;
  notes: NoteProps[];
  connections: string[];
  parentDictionary: ParentDictionary;
  wsRoot: string;
};

export class GraphvizExportPod extends ExportPod<GraphvizExportConfig> {
  static id: string = ID;
  static description: string = "export notes in Graphviz DOT format";

  get config() {
    return super.config.concat([
      {
        key: "includeHierarchy",
        description:
          "Include hierarchical note connections (e.g. parent -> child connections)",
        default: true,
        type: "boolean",
      },
      {
        key: "includeLinks",
        description:
          "Include linked note relationships, e.g. note with [[link]] -> another note",
        default: false,
        type: "boolean",
      },
    ]);
  }

  // Dashes are not allowed, so they are removed.
  // Initial numbers mess with rendering, so each entry is prefixed with "note"
  parseText = (s: string) => (s ? `note_${s.split("-").join("")}` : "");

  processNote(
    opts: GraphvizExportPodProcessProps
  ): [string[], ParentDictionary] {
    const {
      note,
      notes,
      connections,
      parentDictionary,
      wsRoot,
      includeHierarchy,
      includeLinks,
    } = opts;

    if (!note) return [connections, parentDictionary];

    const localConnections: string[] = [
      // Initial node with label
      `${this.parseText(note.id)} [label="${note.title}"]`,
    ];

    // Parent -> Child connection
    if (includeHierarchy) {
      const parentID: string | undefined = parentDictionary[note.id];

      if (parentID) {
        localConnections.push(
          `${this.parseText(parentID)} -- ${this.parseText(note.id)}`
        );
      }
    }

    // Prepare Parent -> Child connection for this note's children
    note.children.forEach(
      (child: string) => (parentDictionary[child] = note.id)
    );

    // Note -> Linked Notes connections
    if (includeLinks) {
      note.links.forEach((link: DLink) => {
        if (link.to) {
          const destinationNote = NoteUtils.getNoteByFnameV5({
            fname: link.to!.fname as string,
            vault: note.vault,
            notes: notes,
            wsRoot,
          });

          if (!_.isUndefined(destinationNote)) {
            if (
              (includeLinks && !includeHierarchy) ||
              !note.children.includes(destinationNote.id)
            ) {
              localConnections.push(
                `${this.parseText(note.id)} -- ${this.parseText(
                  destinationNote.id
                )} [style=dotted]`
              );
            }
          }
        }
      });
    }

    return [[...connections, ...localConnections], parentDictionary];
  }

  async plant(opts: ExportPodPlantOpts) {
    const { dest, notes, wsRoot, config } = opts;

    const {
      includeHierarchy = true,
      includeLinks = false,
    } = config as GraphvizExportConfig;

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
          includeHierarchy,
          includeLinks,
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
