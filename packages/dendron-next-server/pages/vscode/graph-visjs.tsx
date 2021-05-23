import { createLogger, engineSlice } from '@dendronhq/common-frontend';
import { useThemeSwitcher } from 'react-css-theme-switcher';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/layout';
import { useRouter } from 'next/router';
import { Data, DataSet, Network, Options } from 'vis-network';

export default function FullGraphVizjs({
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
  const [network, setNetwork] = useState<Network>();

  useEffect(() => {
    if (graphRef.current) {
      logger.log('Getting nodes...');
      const nodes = Object.values(notes).map((note) => ({
        id: note.id,
        label: note.title,
      }));

      logger.log('Getting edges...');
      const edges = Object.values(notes)
        .map((note) => {
          const childConnections = note.children.map((child) => ({
            from: note.id,
            to: child,
          }));

          return childConnections;
        })
        .flat();

      // provide the data in the vis format
      const data: Data = {
        nodes,
        edges,
      };
      const options: Options = {
        edges: {
          width: 0.15,
          color: { inherit: 'from' },
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 1,
          },
        },
        nodes: {
          shape: 'dot',
          scaling: {
            min: 10,
            max: 30,
            label: {
              min: 8,
              max: 30,
              drawThreshold: 12,
              maxVisible: 20,
            },
          },
        },
        // Taken from https://visjs.github.io/vis-network/examples/static/jsfiddle.7610fcbd32f0ad59a94ac116ccfd21ebc4842436d2bb73c23c54626ed9ec1e23.html
        // https://visjs.github.io/vis-network/examples/static/jsfiddle.a6eacda850dfe6c88d8ea581887b67b263eb310301cdd593e76f7cabd6df4800.html
        physics: false,
        interaction: {
          tooltipDelay: 200,
          hideEdgesOnDrag: true,
          hideEdgesOnZoom: true,
        },
      };

      logger.log('Rendering graph...');

      // initialize your network!
      setNetwork(new Network(graphRef.current, data, options));

      logger.log('Graph rendered.');
    }
  }, [graphRef, notes]);

  return <Box w='100vw' h='100vh' id='graph' ref={graphRef}></Box>;
}
