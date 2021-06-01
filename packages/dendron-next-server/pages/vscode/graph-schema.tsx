import {
  createLogger,
  engineSlice,
} from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import  {
  ElementsDefinition,
  EventHandler,
} from 'cytoscape';
import Graph from '../../components/graph';

export default function FullSchemaGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const schemas = engine ? engine.schemas || {} : {};

  const logger = createLogger('Graph');

  const [elements, setElements] = useState<ElementsDefinition>();

  // Process schemas
  useEffect(() => {
    const schemaArray = Object.values(schemas);

    const ROOT_NODE = {
      data: { id: 'graph_root', label: 'Schemas', group: 'nodes' },
      selectable: false,
    };
    const nodes: any[] = [ROOT_NODE];
    const edges: any[] = [];

    schemaArray.forEach((schema) => {
      const SCHEMA_ID = `${schema.vault.name}_${schema.fname}`;

      // Base schema node
      nodes.push({
        data: { id: SCHEMA_ID, label: schema.fname, group: 'nodes' },
      });

      // Schema node -> root connection
      edges.push({
        data: {
          group: 'edges',
          id: `${ROOT_NODE.data.id}_${SCHEMA_ID}`,
          source: ROOT_NODE.data.id,
          target: SCHEMA_ID,
        },
        classes: 'hierarchy',
      });

      // Children schemas
      Object.values(schema.schemas).forEach((subschema) => {
        const SUBSCHEMA_ID = `${schema.vault.name}_${subschema.id}`;

        // Subschema node
        nodes.push({
          data: { id: SUBSCHEMA_ID, label: subschema.title, group: 'nodes' },
        });

        // Schema -> subschema connection
        edges.push({
          data: {
            group: 'edges',
            id: `${SCHEMA_ID}_${SUBSCHEMA_ID}`,
            source: SCHEMA_ID,
            target: SUBSCHEMA_ID,
          },
          classes: 'hierarchy',
        });
      });
    });

    setElements({ nodes, edges });
  }, [engine]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode) return;

    // TODO: Implement schema opening
    //   postVSCodeMessage({
    //     type: GraphViewMessageType.onSelect,
    //     data: { id },
    //     source: DMessageSource.webClient,
    //   } as GraphViewMessage);
  };

  return <Graph elements={elements} onSelect={onSelect} type='schema' />;
}
