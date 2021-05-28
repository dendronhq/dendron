import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from '@chakra-ui/layout';
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

const getCytoscapeStyle = (themes: any, theme: string | undefined) => `
  node {
    width: 10;
    height: 10;
    background-color: ${theme === themes.dark ? '#666' : '#c2c2c2'};
    color: ${theme === themes.dark ? '#fff' : '#333'};
    label: data(label);
    border-width: 1;
    border-color: ${theme === themes.dark ? '#fff' : '#A0A0A0'};
    font-size: 8;
    min-zoomed-font-size: 12;
    font-weight: 500;
  }

  edge {
    width: 1;
    line-color: ${theme === themes.dark ? '#333' : '#c2c2c2'};
    target-arrow-shape: none;
    curve-style: haystack;
  }

  node:selected {
    background-color: #54B758;
    border-color: #208d24;
  }

  edge[type = 'link'] {
    line-style: dashed;
  }

  edge[type = 'hierarchy'] {
  }
`

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
              type: 'hierarchy',
            },
          })
        );

        const linkConnections: EdgeDefinition[] = [];

        // Find and add linked notes
        note.links.forEach((link) => {
          if (link.to && note.id) {
            const to = NoteUtils.getNoteByFnameV5({
              fname: link.to!.fname as string,
              vault: note.vault,
              notes: notes,
              wsRoot: router.query.ws as string,
            });

            if (!to) return;
            linkConnections.push({
              data: {
                group: 'edges',
                id: `${note.id}_${to.id}`,
                source: note.id,
                target: to.id,
                type: 'link'
              },
            });
          }
        });

        return [...childConnections, ...linkConnections];
      })
      .flat();

    setElements({ nodes, edges });
  }, [notes]);

  useEffect(() => {
    if (graphRef.current && elements) {
      const isLargeGraph = elements.nodes.length + elements.edges.length > 1000;

      logger.log('Rendering graph...');

      cytoscape.use(euler);

      const network = cytoscape({
        container: graphRef.current,
        elements,

        // style: `
        // node {
        //   width: 15;
        //   height: 15;
        //   background-color: #666;
        //   color: #fff;
        //   label: data(label);
        //   font-size: 10;
        //   min-zoomed-font-size: 12;
        // }
        // .hierarchy {
        //   width: 2;
        //   line-color: #54B758;
        //   target-arrow-shape: none;
        //   curve-style: haystack;
        // }
        // .link {
        //   width: 2;
        //   line-color: #548fb7;
        //   target-arrow-shape: none;
        //   curve-style: haystack;
        // }
        // `,

        style: getCytoscapeStyle(themes, currentTheme),

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

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
    <Box w='100vw' h='100vh' id='graph' position='relative'>
      <Box w='100%' h='100%' ref={graphRef} zIndex={1}></Box>
      {elements && (
        <Box position='absolute' bottom={8} right={8} zIndex={2}>
          <Text m={0} p={0}>
            Nodes: {elements.nodes.length}
          </Text>
          <Text m={0} p={0}>
            Edges: {elements.edges.length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
