import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import cytoscape, {
  Core,
  EdgeDefinition,
  ElementsDefinition,
  EventHandler,
} from 'cytoscape';
// @ts-ignore
import euler from 'cytoscape-euler';
import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageType,
  NoteUtils,
} from '@dendronhq/common-all';
import { useRouter } from 'next/router';
import { useThemeSwitcher } from 'react-css-theme-switcher';
import { Space, Typography } from 'antd';
import Head from 'next/head';
import Graph from '../../components/graph';

const getCytoscapeStyle = (themes: any, theme: string | undefined) => `
    node {
      width: 5;
      height: 5;
      background-color: ${theme === themes.dark ? '#807B7B' : '#999393'};
      border-color: ${theme === themes.dark ? '#807B7B' : '#999393'};
      color: ${theme === themes.dark ? '#fff' : '#2F3438'};
      label: data(label);
      border-width: 1;
      font-size: 10;
      min-zoomed-font-size: 10;
      font-weight: 400;
    }
  
    edge {
      width: 0.25;
      line-color: ${theme === themes.dark ? '#807B7B' : '#999393'};
      target-arrow-shape: none;
      curve-style: haystack;
    }
  
    :selected, .open {
      background-color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
      border-color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
      color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
    }
  `;

export default function FullSchemaGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const schemas = engine ? engine.schemas || {} : {};

  const logger = createLogger('Graph');
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();

  const graphRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<ElementsDefinition>();
  const [cy, setCy] = useState<Core>();

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
    if (!isNode || _.isUndefined(cy)) return;
    // if (_.isUndefined(cy)) return;

    // logger.log('Connected edges:', j.connectedEdges())

    cy.$('.open').removeClass('open');

    cy.getElementById(id).addClass('open');

    // TODO: Implement schema opening
    //   postVSCodeMessage({
    //     type: GraphViewMessageType.onSelect,
    //     data: { id },
    //     source: DMessageSource.webClient,
    //   } as GraphViewMessage);
  };

  return <Graph elements={elements} onSelect={onSelect} type='schema' />;
}
