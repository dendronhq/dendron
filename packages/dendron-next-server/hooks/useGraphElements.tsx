import { NoteProps ,
  DVault,
  NotePropsDict,
  NoteUtils,
  SchemaModuleDict,
  SchemaProps,
  VaultUtils,
} from "@dendronhq/common-all";

import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { EdgeDefinition } from "cytoscape";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GraphUtils } from "../components/graph";
import {
  GraphConfig,
  GraphEdges,
  GraphElements,
  GraphNodes,
} from "../lib/graph";

const getVaultClass = (vault: DVault) => {
  const vaultName = VaultUtils.getName(vault);
  return `vault-${vaultName}`;
};

const DEFAULT_CLASSES = '' //graph-view
const DEFAULT_NODE_CLASSES = `${DEFAULT_CLASSES}` //color-fill
const DEFAULT_EDGE_CLASSES = `${DEFAULT_CLASSES}`

const getLocalNoteGraphElements = ({
  notes,
  noteActive,
  vaults,
  wsRoot,
}: {
  notes: NotePropsDict;
  wsRoot: string;
  vaults: DVault[] | undefined;
  noteActive: NoteProps | undefined;
}): GraphElements => {
  const logger = createLogger("getLocalNoteGraphElements");

  if (!noteActive)
    return {
      nodes: [],
      edges: {},
    };

  const activeNote = notes[noteActive.id];
  const parentNote = activeNote.parent ? notes[activeNote.parent] : undefined;
  const connectedNotes = NoteUtils.getNotesWithLinkTo({
    note: activeNote,
    notes,
  });

  // Add active node
  const nodes: GraphNodes = [
    {
      data: {
        id: activeNote.id,
        label: activeNote.title,
        group: "nodes",
        fname: activeNote.fname,
        stub: _.isUndefined(activeNote.stub) ? false : activeNote.stub,
        localRoot: true,
      },
      classes: `${DEFAULT_NODE_CLASSES} ${getVaultClass(activeNote.vault)}`,
      selected: true,
    },
  ];

  // Add parent node
  if (parentNote) {
    nodes.push({
      data: {
        id: parentNote.id,
        label: parentNote.title,
        group: "nodes",
        fname: parentNote.fname,
        stub: _.isUndefined(parentNote.stub) ? false : parentNote.stub,
      },
      classes: `${DEFAULT_NODE_CLASSES} parent ${getVaultClass(parentNote.vault)}`,
    });
  }

  // Add connected nodes
  nodes.push(
    ...Object.values(connectedNotes).map((note) => {
      return {
        data: {
          id: note.id,
          label: note.title,
          group: "nodes",
          fname: note.fname,
          stub: _.isUndefined(note.stub) ? false : note.stub,
        },
        classes: `${DEFAULT_NODE_CLASSES} ${getVaultClass(note.vault)}`,
      };
    })
  );

  // Initialize edges
  const edges: GraphEdges = {
    hierarchy: [],
    links: [],
  };

  // Get children of active note
  const noteVaultClass = getVaultClass(activeNote.vault);

  // If note has a parent, add a connection to it
  if (parentNote) {
    edges.hierarchy.push({
      data: {
        group: "edges",
        id: `${parentNote.id}_${activeNote.id}`,
        source: parentNote.id,
        target: activeNote.id,
        fname: parentNote.fname,
        stub: _.isUndefined(parentNote.stub) ? false : parentNote.stub,
      },
      classes: `${DEFAULT_EDGE_CLASSES} hierarchy ${noteVaultClass}`,
    });
  }

  activeNote.children.forEach((child) => {
    const childNote = notes[child];
    nodes.push({
      data: {
        id: child,
        label: childNote.title,
        group: "nodes",
        fname: childNote.fname,
        stub: _.isUndefined(childNote.stub) ? false : childNote.stub,
      },
      classes: `${DEFAULT_NODE_CLASSES} ${getVaultClass(childNote.vault)}`,
    });

    edges.hierarchy.push({
      data: {
        group: "edges",
        id: `${activeNote.id}_${child}`,
        source: activeNote.id,
        target: child,
        fname: activeNote.fname,
        stub: _.isUndefined(activeNote.stub) ? false : activeNote.stub,
      },
      classes: `${DEFAULT_EDGE_CLASSES} hierarchy ${noteVaultClass}`,
    });
  });

  // Get notes linking to active note
  const linkConnections = connectedNotes.map((connectedNote) => {
    return {
      data: {
        group: "edges",
        id: `${activeNote.id}_${connectedNote.id}`,
        source: activeNote.id,
        target: connectedNote.id,
        fname: activeNote.fname,
        stub:
          _.isUndefined(activeNote.stub) && _.isUndefined(connectedNote.stub)
            ? false
            : !!(activeNote.stub || connectedNote.stub),
      },
      classes: `${DEFAULT_EDGE_CLASSES} links ${noteVaultClass}`,
    };
  });

  // Find and add linked notes
  activeNote.links.forEach((link) => {
    if (link.type === "backlink") return;
    if (link.to && link.to.fname && activeNote.id && vaults) {
      const fnameArray = link.to.fname.split("/");

      const toFname = link.to.fname.includes("/")
        ? fnameArray[fnameArray.length - 1]
        : link.to.fname;
      const toVaultName =
        link.to.vaultName ||
        fnameArray[fnameArray.length - 2] ||
        VaultUtils.getName(activeNote.vault);

      const toVault = VaultUtils.getVaultByName({
        vname: toVaultName,
        vaults,
      });

      if (_.isUndefined(toVault)) {
        logger.error(
          `Couldn't find vault of note ${toFname}, aborting link creation`
        );
        return;
      }

      const to = NoteUtils.getNoteByFnameV5({
        fname: fnameArray[fnameArray.length - 1],
        vault: toVault,
        notes,
        wsRoot,
      });

      if (!to) {
        logger.warn(
          `Failed to link note ${VaultUtils.getName(activeNote.vault)}/${
            activeNote.fname
          } to ${VaultUtils.getName(toVault)}/${
            link.to.fname
          }. Most likely, this note does not exist.`
        );
        return;
      }

      const isStub =
        _.isUndefined(activeNote.stub) && _.isUndefined(to.stub)
          ? false
          : !!(activeNote.stub || to.stub);

      nodes.push({
        data: {
          id: to.id,
          label: to.title,
          group: "nodes",
          fname: to.fname,
          stub: isStub,
        },
        classes: `${DEFAULT_NODE_CLASSES} ${getVaultClass(to.vault)}`,
      });

      linkConnections.push({
        data: {
          group: "edges",
          id: `${activeNote.id}_${to.id}`,
          source: activeNote.id,
          target: to.id,
          fname: activeNote.fname,
          stub: isStub,
        },
        classes: `${DEFAULT_EDGE_CLASSES} links ${noteVaultClass}`,
      });
    }
  });

  edges.links.push(...linkConnections);

  return {
    nodes,
    edges,
  };
};

const getFullNoteGraphElements = ({
  notes,
  wsRoot,
  vaults,
  noteActive,
}: {
  notes: NotePropsDict;
  wsRoot: string;
  vaults: DVault[] | undefined;
  noteActive: NoteProps | undefined;
}): GraphElements => {
  const logger = createLogger("graph - getNoteGraphElements");

  // ADD NODES
  const nodes = Object.values(notes).map((note) => {
    const isActive = noteActive && note.id === noteActive.id;
    return {
      data: {
        id: note.id,
        label: note.title,
        group: "nodes",
        fname: note.fname,
        stub: _.isUndefined(note.stub) ? false : note.stub,
      },
      classes: `${DEFAULT_NODE_CLASSES} ${getVaultClass(note.vault)}`,
      selected: isActive,
    };
  });

  // ADD EDGES
  const edges: GraphEdges = {
    hierarchy: [],
    links: [],
  };

  Object.values(notes).forEach((note) => {
    const noteVaultClass = getVaultClass(note.vault);

    edges.hierarchy.push(
      ...note.children.map((child) => {
        const childNote = notes[child];
        const isStub = childNote
          ? _.isUndefined(note.stub) && _.isUndefined(childNote.stub)
            ? false
            : note.stub || childNote.stub
          : false;

        return {
          data: {
            group: "edges",
            id: `${note.id}_${child}`,
            source: note.id,
            target: child,
            fname: note.fname,
            stub: isStub,
          },
          classes: `${DEFAULT_EDGE_CLASSES} hierarchy ${noteVaultClass}`,
        };
      })
    );

    const linkConnections: EdgeDefinition[] = [];

    // Find and add linked notes
    note.links.forEach((link) => {
      if (link.type === "backlink") return;
      if (link.to && link.to.fname && note.id && vaults) {
        const fnameArray = link.to.fname.split("/");

        const toFname = link.to.fname.includes("/")
          ? fnameArray[fnameArray.length - 1]
          : link.to.fname;
        const toVaultName =
          link.to.vaultName ||
          fnameArray[fnameArray.length - 2] ||
          VaultUtils.getName(note.vault);

        const toVault = VaultUtils.getVaultByName({
          vname: toVaultName,
          vaults,
        });

        if (_.isUndefined(toVault)) {
          logger.log(
            `Couldn't find vault of note ${toFname}, aborting link creation`
          );
          return;
        }

        const to = NoteUtils.getNoteByFnameV5({
          fname: fnameArray[fnameArray.length - 1],
          vault: toVault,
          notes,
          wsRoot,
        });

        if (!to) {
          logger.log(
            `Failed to link note ${VaultUtils.getName(note.vault)}/${
              note.fname
            } to ${VaultUtils.getName(toVault)}/${
              link.to.fname
            }. Most likely, this note does not exist.`
          );
          return;
        }

        logger.log(
          `Link from ${note.fname} to ${to.fname}: ${
            _.isUndefined(note.stub) && _.isUndefined(to.stub)
              ? false
              : note.stub || to.stub
          }`
        );

        linkConnections.push({
          data: {
            group: "edges",
            id: `${note.id}_${to.id}`,
            source: note.id,
            target: to.id,
            fname: note.fname,
            stub:
              _.isUndefined(note.stub) && _.isUndefined(to.stub)
                ? false
                : note.stub || to.stub,
          },
          classes: `${DEFAULT_EDGE_CLASSES} links ${noteVaultClass}`,
        });
      }
    });

    edges.links.push(...linkConnections);
  });

  return {
    nodes,
    edges,
  };
};

const getSchemaGraphElements = (
  schemas: SchemaModuleDict,
  vaults: DVault[] | undefined
): GraphElements => {
  const schemaArray = Object.values(schemas);
  const filteredSchemas = schemaArray.filter(
    (schema) => schema.fname !== "root"
  );

  const nodes: any[] = [];
  const edges: GraphEdges = {
    hierarchy: [],
  };

  const logger = createLogger("useGraphElements");

  if (_.isUndefined(vaults)) return { nodes, edges };

  // const linkChildren => {

  vaults.map((vault) => {
    const vaultName = VaultUtils.getName(vault);
    const VAULT_ID = `${vaultName}`;

    // Vault root schema node
    nodes.push({
      data: {
        id: VAULT_ID,
        label: vaultName,
        group: "nodes",
        vault: vaultName,
        fname: "root",
      },
      classes: `${DEFAULT_NODE_CLASSES} vault-${vaultName}`,
    });

    filteredSchemas
      .filter((schema) => VaultUtils.getName(schema.vault) === vaultName)
      .forEach((schema) => {
        const SCHEMA_ID = `${vaultName}_${schema.fname}`;

        // Base schema node
        nodes.push({
          data: {
            id: SCHEMA_ID,
            label: schema.fname,
            group: "nodes",
            fname: schema.fname,
          },
          classes: `${DEFAULT_NODE_CLASSES} vault-${vaultName}`,
        });

        // Schema node -> root connection
        edges.hierarchy.push({
          data: {
            group: "edges",
            id: `${VAULT_ID}_${SCHEMA_ID}`,
            source: VAULT_ID,
            target: SCHEMA_ID,
            fname: schema.fname,
          },
          classes: `${DEFAULT_EDGE_CLASSES} hierarchy vault-${vaultName}`,
        });

        // Add subschema nodes
        Object.values(schema.schemas).forEach((subschema) => {
          const SUBSCHEMA_ID = `${vaultName}_${subschema.id}`;

          // Subschema node
          nodes.push({
            data: {
              id: SUBSCHEMA_ID,
              label: subschema.title,
              group: "nodes",
              fname: schema.fname,
            },
            classes: `${DEFAULT_NODE_CLASSES} vault-${vaultName}`,
          });
        });

        // Recursively adds schema connections of infinite depth
        const addChildConnections = (
          parentSchema: SchemaProps,
          parentSchemaID: string
        ) => {
          parentSchema.children.forEach((child) => {
            const childSchema = schema.schemas[child];
            const CHILD_SCHEMA_ID = `${vaultName}_${childSchema.id}`;

            edges.hierarchy.push({
              data: {
                group: "edges",
                id: `${parentSchemaID}_${CHILD_SCHEMA_ID}`,
                source: parentSchemaID,
                target: CHILD_SCHEMA_ID,
                fname: schema.fname,
              },
              classes: `${DEFAULT_EDGE_CLASSES} hierarchy vault-${vaultName}`,
            });

            addChildConnections(childSchema, `${vaultName}_${childSchema.id}`);
          });
        };

        addChildConnections(schema.root, SCHEMA_ID);
      });
  });

  return {
    nodes,
    edges,
  };
};

const useGraphElements = ({
  type,
  engine,
  config,
  noteActive,
}: {
  type: "note" | "schema";
  engine: engineSlice.EngineState;
  config: GraphConfig;
  noteActive?: NoteProps | undefined;
}) => {
  const logger = createLogger("useGraphElements");
  const router = useRouter();
  const [elements, setElements] = useState<GraphElements>({
    nodes: [],
    edges: {},
  });

  const [noteCount, setNoteCount] = useState(0);
  const [schemaCount, setSchemaCount] = useState(0);

  const isLocalGraph = GraphUtils.isLocalGraph(config);

  useEffect(() => {
    if (type === "note" && engine.notes) {
      // Prevent unnecessary parsing if no notes have been added/deleted
      const wasLocalGraph =
        elements.nodes.filter((node) => !!node.data.localRoot).length > 0;

      const newNoteCount = Object.keys(engine.notes).length;
      if (!wasLocalGraph && noteCount === newNoteCount) return;
      setNoteCount(newNoteCount);

      if (!isLocalGraph) {
        setElements(
          getFullNoteGraphElements({
            notes: engine.notes,
            wsRoot: router.query.ws as string,
            vaults: engine.vaults,
            noteActive,
          })
        );
      }
    }
  }, [engine.notes, isLocalGraph]);

  // Get new elements if active note changes
  useEffect(() => {
    if (type === "note" && engine.notes && isLocalGraph && noteActive) {
      setElements(
        getLocalNoteGraphElements({
          notes: engine.notes,
          wsRoot: router.query.ws as string,
          vaults: engine.vaults,
          noteActive,
        })
      );
    }
  }, [noteActive, engine.notes, isLocalGraph]);

  useEffect(() => {
    if (type === "schema" && engine.schemas) {
      // Prevent unnecessary parsing if no schemas have been added/deleted
      const newSchemaCount = Object.keys(engine.schemas).length;
      if (schemaCount === newSchemaCount) return;
      setSchemaCount(newSchemaCount);

      setElements(getSchemaGraphElements(engine.schemas, engine.vaults));
    }
  }, [engine.schemas]);

  return elements;
};

export default useGraphElements;
