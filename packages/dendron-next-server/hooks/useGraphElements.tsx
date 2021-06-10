import {
  DVault,
  NotePropsDict,
  NoteUtils,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { engineSlice } from "@dendronhq/common-frontend";
import { EdgeDefinition, NodeDefinition } from "cytoscape";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GraphEdges, GraphElements, GraphNodes } from "../lib/graph";

const getNoteGraphElements = (
  notes: NotePropsDict,
  wsRoot: string
): GraphElements => {
  // ADD NODES
  const nodes = Object.values(notes).map((note) => ({
    data: { id: note.id, label: note.title, group: "nodes" },
  }));

  // ADD EDGES
  const edges: GraphEdges = {
    hierarchy: [],
    links: [],
  };

  Object.values(notes).forEach((note) => {
    edges.hierarchy.push(
      ...note.children.map((child) => ({
        data: {
          group: "edges",
          id: `${notes.id}_${child}`,
          source: note.id,
          target: child,
        },
        classes: "hierarchy",
      }))
    );

    const linkConnections: EdgeDefinition[] = [];

    // Find and add linked notes
    note.links.forEach((link) => {
      if (link.to && note.id) {
        const to = NoteUtils.getNoteByFnameV5({
          fname: link.to!.fname as string,
          vault: note.vault,
          notes: notes,
          wsRoot,
        });

        if (!to) return;
        linkConnections.push({
          data: {
            group: "edges",
            id: `${note.id}_${to.id}`,
            source: note.id,
            target: to.id,
          },
          classes: "links",
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

  const nodes: any[] = [];
  const edges: GraphEdges = {
    hierarchy: [],
  };

  if (_.isUndefined(vaults)) return { nodes, edges };

  vaults.map((vault) => {
    const VAULT_ID = `${vault.name}`;

    nodes.push({
      data: {
        id: VAULT_ID,
        label: vault.name,
        group: "nodes",
        selectable: false,
      },
    });

    schemaArray
      .filter((schema) => schema.vault.name === vault.name)
      .forEach((schema) => {
        const SCHEMA_ID = `${vault.name}_${schema.fname}`;

        // Base schema node
        nodes.push({
          data: { id: SCHEMA_ID, label: schema.fname, group: "nodes" },
        });

        // Schema node -> root connection
        edges.hierarchy.push({
          data: {
            group: "edges",
            id: `${VAULT_ID}_${SCHEMA_ID}`,
            source: VAULT_ID,
            target: SCHEMA_ID,
          },
          classes: "hierarchy",
        });

        // Children schemas
        Object.values(schema.schemas).forEach((subschema) => {
          const SUBSCHEMA_ID = `${vault.name}_${subschema.id}`;

          // Subschema node
          nodes.push({
            data: {
              id: SUBSCHEMA_ID,
              label: subschema.title,
              group: "nodes",
              fname: schema.fname,
            },
          });

          // Schema -> subschema connection
          edges.hierarchy.push({
            data: {
              group: "edges",
              id: `${SCHEMA_ID}_${SUBSCHEMA_ID}`,
              source: SCHEMA_ID,
              target: SUBSCHEMA_ID,
            },
            classes: "hierarchy",
          });
        });
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
}: {
  type: "note" | "schema";
  engine: engineSlice.EngineState;
}) => {
  const router = useRouter();
  const [elements, setElements] = useState<GraphElements>({
    nodes: [],
    edges: {},
  });

  useEffect(() => {
    if (type === "note" && engine.notes) {
      setElements(
        getNoteGraphElements(engine.notes, router.query.ws as string)
      );
    }
  }, [engine.notes]);

  useEffect(() => {
    if (type === "schema" && engine.schemas) {
      setElements(getSchemaGraphElements(engine.schemas, engine.vaults));
    }
  }, [engine.schemas]);

  return elements;
};

export default useGraphElements;
