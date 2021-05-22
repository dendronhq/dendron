import { createLogger, engineSlice } from '@dendronhq/common-frontend';
import { useThemeSwitcher } from 'react-css-theme-switcher';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { Box, Text } from '@chakra-ui/layout';
import cytoscape, { Core, EdgeDefinition } from 'cytoscape';
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

  const [cy, setCy] = useState<Core>();
  const graphRef = useRef();

  const nodes = Object.values(notes).map((note) => ({
    data: { id: note.id, label: note.title },
  }));

  const edges = Object.values(notes)
    .map((note) => {
      const childConnections: EdgeDefinition[] = note.children.map((child) => ({
        data: {
          id: `${notes.id}-${child}`,
          source: note.id,
          target: child,
          classes: ['hierarchy'],
        },
      }));

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

  useEffect(() => {
    logger.log(!!graphRef.current);
    if (graphRef.current) {
      setCy(
        cytoscape({
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
                width: 30,
                height: 30,
                'background-color': '#666',
                color: '#fff',
                label: 'data(label)',
                'font-size': 12,
              },
            },

            {
              selector: 'edge',
              style: {
                width: 3,
                'line-color': '#54B758',
                'target-arrow-color': '#54B758',
                'target-arrow-shape': 'none',
                'curve-style': 'bezier',
              },
            },
          ],

          layout: {
            name: 'cose',
          },
        })
      );
    }
  }, [graphRef, notes]);

  return <Box w='100vw' h='100vh' id='graph' ref={graphRef}></Box>;
}
