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
    background-color: ${theme === themes.dark ? '#666262' : '#999393'};
    border-color: ${theme === themes.dark ? '#666262' : '#999393'};
    color: ${theme === themes.dark ? '#fff' : '#2F3438'};
    label: data(label);
    border-width: 1;
    font-size: 10;
    min-zoomed-font-size: 10;
    font-weight: 400;
  }

  edge {
    width: 0.5;
    line-color: ${theme === themes.dark ? '#666262' : '#999393'};
    target-arrow-shape: none;
    curve-style: haystack;
  }

  node:selected {
    background-color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
    border-color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
    color: ${theme === themes.dark ? '#36B73B' : '#27AC2C'};
  }

  edge.link {
    width: 0.25;
    line-style: dashed;
    line-color: ${theme === themes.dark ? '#333131' : '#CCC4C4'};
  }

  edge.hierarchy {
    width: 0.25;
    line-color: ${theme === themes.dark ? '#4D4A4A' : '#B3ACAC'};
  }
`;

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter();
  const notes = engine ? engine.notes || {} : {};
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  const graphRef = useRef<HTMLDivElement>(null);
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();

  const [elements, setElements] = useState<ElementsDefinition>();

  const [cy, setCy] = useState<Core>();

  // Process note notes and edges
  useEffect(() => {
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
  }, [notes]);

  useEffect(() => {
    if (graphRef.current && elements) {
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
          animate: !isLargeGraph,
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
    if (!isNode) return;
    // if (_.isUndefined(cy)) return;

    // const j = cy.$(`#${id}`);
    // logger.log('Connected edges:', j.connectedEdges())

    logger.log('Selected Node ID:', id);
    logger.log('Selected Node ID:', e.target[0]._private);

    postVSCodeMessage({
      type: GraphViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
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
