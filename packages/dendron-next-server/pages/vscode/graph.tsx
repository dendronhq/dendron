import { createLogger, engineSlice } from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from '@chakra-ui/layout';
import cytoscape, { Core, EdgeDefinition, ElementsDefinition } from 'cytoscape';
import euler from 'cytoscape-euler';
import { NoteUtils } from '@dendronhq/common-all';
import { useRouter } from 'next/router';

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter()
  const notes = engine ? engine.notes : {};
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  const graphRef = useRef();

  const [elements, setElements] = useState<ElementsDefinition>();

  const [cy, setCy] = useState<Core>();

  // Process note notes and edges
  useEffect(() => {
    logger.log('Getting nodes...');
    const nodes = Object.values(notes).map((note) => ({
      data: { id: note.id, label: note.title },
    }));

    logger.log('Getting edges...');
    const edges = Object.values(notes)
      .map((note) => {
        const childConnections: EdgeDefinition[] = note.children.map(
          (child) => ({
            data: {
              id: `${notes.id}-${child}`,
              source: note.id,
              target: child,
              classes: ['hierarchy'],
            },
          })
        );

        const linkConnections: EdgeDefinition[] = []
        
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
                  id: `${note.id}_${to.id}`,
                  source: note.id,
                  target: to.id,
                  classes: ['link'],
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
        //   node {
        //     width: 15;
        //     height: 15;
        //     background-color: #666;
        //     color: #fff;
        //     label: data(label);
        //     font-size: 10;
        //     min-zoomed-font-size: 12;
        //   }
        //   .hierarchy {
        //     width: 2;
        //     line-color: #54B758;
        //     target-arrow-shape: none;
        //     curve-style: haystack;
        //   }
        //   .link {
        //     width: 2;
        //     line-color: #548fb7;
        //     target-arrow-shape: none;
        //     curve-style: haystack;
        //   }
        // `,

        style: [
          // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              width: 15,
              height: 15,
              'background-color': '#666',
              color: '#fff',
              label: 'data(label)',
              'font-size': 10,
              'min-zoomed-font-size': 12,
            },
          },

          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#54B758',
              'target-arrow-shape': 'none',
              'curve-style': 'haystack', // for lesser performance, use 'bezier',
            },
          },
          // TODO: Figure out how to style selectors
          // {
          //   selector: '.link',
          //   style: {
          //     width: 2,
          //     'line-color': '#548fb7',
          //   },
          // },
        ],

        // style: cytoscape.stylesheet().selector('.link').style() ,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      network
        .layout({
          name: 'euler',
          // @ts-ignore
          springLength: (edge) => 80,
          springCoeff: (edge) => 0.0008,
          mass: (node) => 4,
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

      setCy(network);
    }
  }, [graphRef, elements]);

  return (
    <Box w='100vw' h='100vh' id='graph' position='relative'>
      <Box w='100%' h='100%' ref={graphRef} zIndex={1}></Box>
      {elements && <Box position='absolute' bottom={8} right={8} zIndex={2}>
        <Text  m={0} p={0}>Nodes: {elements.nodes.length}</Text>
        <Text  m={0} p={0}>Edges: {elements.edges.length}</Text>
        </Box>}
    </Box>
  );
}
