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

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter();
  
  const isNoteGraph = router.query.type !== 'schema';
  const notes = engine ? engine.notes || {} : {};
  const schemas = engine ? engine.schemas || {} : {};
  
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  const graphRef = useRef<HTMLDivElement>(null);
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();
  
  const [elements, setElements] = useState<ElementsDefinition>();
  
  const [cy, setCy] = useState<Core>();
  
  logger.log(router.query,router.query.type, isNoteGraph)

  // Process note notes and edges
  useEffect(() => {    
    // NOTE GRAPH
    if (isNoteGraph) {
      logger.log('Getting nodes...');
      const nodes = Object.values(notes).map((note) => ({
        data: { id: note.id, label: note.title, group: 'nodes' },
      }));

      logger.log('Getting edges...');
      const edges = Object.values(notes)
        .map((note) => {
          const childConnections: EdgeDefinition[] = note.children.map(
            (child) => ({
              data: {
                group: 'edges',
                id: `${notes.id}_${child}`,
                source: note.id,
                target: child,
              },
              classes: 'hierarchy',
            })
          );

          const linkConnections: EdgeDefinition[] = [];

          // Find and add linked notes
          // note.links.forEach((link) => {
          //   if (link.to && note.id) {
          //     const to = NoteUtils.getNoteByFnameV5({
          //       fname: link.to!.fname as string,
          //       vault: note.vault,
          //       notes: notes,
          //       wsRoot: router.query.ws as string,
          //     });

          //     if (!to) return;
          //     linkConnections.push({
          //       data: {
          //         group: 'edges',
          //         id: `${note.id}_${to.id}`,
          //         source: note.id,
          //         target: to.id,
          //       },
          //       classes: 'link'
          //     });
          //   }
          // });

          return [...childConnections, ...linkConnections];
        })
        .flat();

      setElements({ nodes, edges });
    }
    
    // SCHEMA GRAPH
    else {
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
          const SUBSCHEMA_ID = `${schema.vault.name}_${subschema.id}`

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
    }
  }, [engine]);

  useEffect(() => {
    if (graphRef.current && elements) {
      // Naive check to prevent full graph re-renders when selecting a node
      if (cy && cy.elements('*').length > 5) return;

      const isLargeGraph = elements.nodes.length + elements.edges.length > 1000;

      logger.log('Rendering graph...');

      // Add layout middleware
      cytoscape.use(euler);

      const network = cytoscape({
        container: graphRef.current,
        elements,
        style: getCytoscapeStyle(themes, currentTheme) as any,

        // Zoom levels
        minZoom: 0.1,
        maxZoom: 10,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      // Layout graph nodes
      network
        .layout({
          name: 'euler',
          // @ts-ignore
          springLength: () => 80,
          springCoeff: () => 0.0008,
          mass: () => 4,
          gravity: -1.2,
          pull: 0.0001,
          theta: 0.666,
          dragCoeff: 0.02,
          movementThreshold: 1,
          timeStep: 20,
          refresh: 10,
          animate: false, //!isLargeGraph,
          animationDuration: undefined,
          animationEasing: undefined,
          maxIterations: 1000,
          maxSimulationTime: 4000,
          ungrabifyWhileSimulating: false,
          fit: true,
          padding: 30,
          boundingBox: undefined,
          randomize: false,
        })
        .run();

      network.on('select', onSelect);

      setCy(network);
    }
  }, [graphRef, elements]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode || _.isUndefined(cy)) return;
    // if (_.isUndefined(cy)) return;

    // logger.log('Connected edges:', j.connectedEdges())

    cy.$('.open').removeClass('open');

    cy.getElementById(id).addClass('open');

    // TODO: .open class not affecting rendered output

    if (isNoteGraph) {
      postVSCodeMessage({
        type: GraphViewMessageType.onSelect,
        data: { id },
        source: DMessageSource.webClient,
      } as GraphViewMessage);
    }
  };

  return (
    <>
      <Head>
        <title>Dendron Graph</title>
      </Head>
      <div
        id='graph'
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
        }}
      >
        <div
          ref={graphRef}
          style={{
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        ></div>
        {elements && (
          <Space
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              zIndex: 2,
            }}
            direction='vertical'
          >
            <Typography.Text>Nodes: {elements.nodes.length}</Typography.Text>
            <Typography.Text>Edges: {elements.edges.length}</Typography.Text>
          </Space>
        )}
      </div>
    </>
  );
}
