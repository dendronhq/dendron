import {
  createLogger,
} from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import cytoscape, {
  Core,
  ElementsDefinition,
  EventHandler,
} from 'cytoscape';
// @ts-ignore
import euler from 'cytoscape-euler';
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

export default function Graph({
  elements,
  type = 'note',
  onSelect,
}: {
  elements: ElementsDefinition | undefined;
  onSelect: EventHandler;
  type?: 'note' | 'schema';
}) {
  const router = useRouter();

  const logger = createLogger('Graph');
  const graphRef = useRef<HTMLDivElement>(null);
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();

  const [cy, setCy] = useState<Core>();

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

      network.on('select', (e) => onSelect(e));

      setCy(network);
    }
  }, [graphRef, elements]);

  return (
    <>
      <Head>
        <title>{_.capitalize(type)} Graph</title>
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
