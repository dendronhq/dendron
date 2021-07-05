import {
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
import { GraphEdges, GraphElements } from "../lib/graph";

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
      data: {
        id: note.id,
        label: note.title,
        group: "nodes",
        fname: note.fname,
        stub: _.isUndefined(note.stub) ? false : note.stub,
      },
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
          classes: `hierarchy ${noteVaultClass}`,
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
  logger.log(schemas);

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
      classes: `vault-${vaultName}`,
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
          classes: `vault-${vaultName}`,
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
          classes: `hierarchy vault-${vaultName}`,
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
            classes: `vault-${vaultName}`,
          });
        });

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
              classes: `hierarchy vault-${vaultName}`,
            });

            addChildConnections(childSchema, `${vaultName}_${childSchema.id}`);
          });
        };

        if (schema.root) addChildConnections(schema.root, SCHEMA_ID);

        // Schema -> subschema connection
        // edges.hierarchy.push({
        //   data: {
        //     group: "edges",
        //     id: `${SCHEMA_ID}_${SUBSCHEMA_ID}`,
        //     source: SCHEMA_ID,
        //     target: SUBSCHEMA_ID,
        //     fname: schema.fname,
        //   },
        //   classes: `hierarchy vault-${vaultName}`,
        // });
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

  const [noteCount, setNoteCount] = useState(0);
  const [schemaCount, setSchemaCount] = useState(0);

  useEffect(() => {
    if (type === "note" && engine.notes) {
      // Prevent unnecessary parsing if no notes have been added/deleted
      const newNoteCount = Object.keys(engine.notes).length;
      if (noteCount === newNoteCount) return;
      setNoteCount(newNoteCount);

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
