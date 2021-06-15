import {
  DVault,
  NotePropsDict,
  NoteUtils,
  SchemaModuleDict,
  VaultUtils,
} from "@dendronhq/common-all";
import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import { EdgeDefinition, NodeDefinition } from "cytoscape";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GraphEdges, GraphElements, GraphNodes } from "../lib/graph";

const getVaultClass = (vault: DVault) => {
  const vaultName = VaultUtils.getName(vault);
  return `vault-${vaultName}`;
};

const getNoteGraphElements = (
  notes: NotePropsDict,
  wsRoot: string,
  vaults: DVault[] | undefined
): GraphElements => {
  const logger = createLogger("graph - getNoteGraphElements");

  // ADD NODES
  const nodes = Object.values(notes).map((note) => {
    return {
      data: { id: note.id, label: note.title, group: "nodes" },
      classes: `${getVaultClass(note.vault)}`,
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
      ...note.children.map((child) => ({
        data: {
          group: "edges",
          id: `${notes.id}_${child}`,
          source: note.id,
          target: child,
        },
        classes: `hierarchy ${noteVaultClass}`,
      }))
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
          notes: notes,
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

        linkConnections.push({
          data: {
            group: "edges",
            id: `${note.id}_${to.id}`,
            source: note.id,
            target: to.id,
          },
          classes: `links ${noteVaultClass}`,
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
      },
      classes: `vault-${vaultName}`,
    });

    filteredSchemas
      .filter((schema) => VaultUtils.getName(schema.vault) === vaultName)
      .forEach((schema) => {
        const SCHEMA_ID = `${vaultName}_${schema.fname}`;

        // Base schema node
        nodes.push({
          data: { id: SCHEMA_ID, label: schema.fname, group: "nodes" },
          classes: `vault-${vaultName}`,
        });

        // Schema node -> root connection
        edges.hierarchy.push({
          data: {
            group: "edges",
            id: `${VAULT_ID}_${SCHEMA_ID}`,
            source: VAULT_ID,
            target: SCHEMA_ID,
          },
          classes: `hierarchy vault-${vaultName}`,
        });

        // Children schemas
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
            classes: `vault-${vaultName}`,
          });

          // Schema -> subschema connection
          edges.hierarchy.push({
            data: {
              group: "edges",
              id: `${SCHEMA_ID}_${SUBSCHEMA_ID}`,
              source: SCHEMA_ID,
              target: SUBSCHEMA_ID,
            },
            classes: `hierarchy vault-${vaultName}`,
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
        getNoteGraphElements(
          engine.notes,
          router.query.ws as string,
          engine.vaults
        )
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
