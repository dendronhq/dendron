import { createLogger, engineSlice } from '@dendronhq/common-frontend';
import { useThemeSwitcher } from 'react-css-theme-switcher';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { Box, Text } from '@chakra-ui/layout';
import cytoscape, { Core, EdgeDefinition } from 'cytoscape';
import euler from 'cytoscape-euler';
import { NoteUtils } from '@dendronhq/common-all';
import { useRouter } from 'next/router';

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter();
  const notes = engine ? engine.notes : {};
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();
  const [_isDarkMode, setIsDarkMode] = React.useState(false);
  const graphRef = useRef();
  const [cy, setCy] = useState<Core>();

  useEffect(() => {
    if (graphRef.current) {
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

          const linkConnections: EdgeDefinition[] = [];
          //   = note.links.map((link) => {
          //     if (link.to) {
          //       const to = NoteUtils.getNoteByFnameV5({
          //         fname: link.to!.fname as string,
          //         vault: note.vault,
          //         notes: notes,
          //         wsRoot: router.query.ws,
          //       });
          //       return {
          //         data: {
          //           id: `${notes.id}-${to.id}`,
          //           source: note.id,
          //           target: to.id,
          //           classes: ['edge--hierarchy'],
          //         },
          //       };
          //     }
          //   });

          return [...childConnections, ...linkConnections];
        })
        .flat();

        const isLargeGraph = nodes.length + edges.length > 1000

      logger.log('Rendering graph...');

      cytoscape.use(euler);

      const network = cytoscape({
        container: graphRef.current,
        elements: {
          nodes,
          edges,
        },

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
              'target-arrow-color': '#54B758',
              'target-arrow-shape': 'none',
              'curve-style': 'haystack', // for lesser performance, use 'bezier',
            },
          },
        ],

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      network
        .layout({
          name: 'euler',

          // The ideal length of a spring
          // - This acts as a hint for the edge length
          // - The edge length can be longer or shorter if the forces are set to extreme values
          // @ts-ignore
          springLength: (edge) => 80,

          // Hooke's law coefficient
          // - The value ranges on [0, 1]
          // - Lower values give looser springs
          // - Higher values give tighter springs
          springCoeff: (edge) => 0.0008,

          // The mass of the node in the physics simulation
          // - The mass affects the gravity node repulsion/attraction
          mass: (node) => 4,

          // Coulomb's law coefficient
          // - Makes the nodes repel each other for negative values
          // - Makes the nodes attract each other for positive values
          gravity: -1.2,

          // A force that pulls nodes towards the origin (0, 0)
          // Higher values keep the components less spread out
          pull: 0.0001,

          // Theta coefficient from Barnes-Hut simulation
          // - Value ranges on [0, 1]
          // - Performance is better with smaller values
          // - Very small values may not create enough force to give a good result
          theta: 0.666,

          // Friction / drag coefficient to make the system stabilise over time
          dragCoeff: 0.02,

          // When the total of the squared position deltas is less than this value, the simulation ends
          movementThreshold: 1,

          // The amount of time passed per tick
          // - Larger values result in faster runtimes but might spread things out too far
          // - Smaller values produce more accurate results
          timeStep: 20,

          // The number of ticks per frame for animate:true
          // - A larger value reduces rendering cost but can be jerky
          // - A smaller value increases rendering cost but is smoother
          refresh: 10,

          // Whether to animate the layout
          // - true : Animate while the layout is running
          // - false : Just show the end result
          // - 'end' : Animate directly to the end result
          animate: !isLargeGraph,

          // Animation duration used for animate:'end'
          animationDuration: undefined,

          // Easing for animate:'end'
          animationEasing: undefined,

          // Maximum iterations and time (in ms) before the layout will bail out
          // - A large value may allow for a better result
          // - A small value may make the layout end prematurely
          // - The layout may stop before this if it has settled
          maxIterations: 1000,
          maxSimulationTime: 4000,

          // Prevent the user grabbing nodes during the layout (usually with animate:true)
          ungrabifyWhileSimulating: false,

          // Whether to fit the viewport to the repositioned graph
          // true : Fits at end of layout for animate:false or animate:'end'; fits on each frame for animate:true
          fit: true,

          // Padding in rendered co-ordinates around the layout
          padding: 30,

          // Constrain layout bounds with one of
          // - { x1, y1, x2, y2 }
          // - { x1, y1, w, h }
          // - undefined / null : Unconstrained
          boundingBox: undefined,

          // Layout event callbacks; equivalent to `layout.one('layoutready', callback)` for example
          // ready: function () {}, // on layoutready
          // stop: function () {}, // on layoutstop

          // Whether to randomize the initial positions of the nodes
          // true : Use random positions within the bounding box
          // false : Use the current node positions as the initial positions
          randomize: false,
        })
        .run();

      setCy(network);
    }
  }, [graphRef, notes]);

  return <Box w='100vw' h='100vh' id='graph' ref={graphRef}></Box>;
}
