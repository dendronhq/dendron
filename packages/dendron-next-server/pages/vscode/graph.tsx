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

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const router = useRouter();

  const notes = engine ? engine.notes || {} : {};
  
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  const { switcher, themes, currentTheme, status } = useThemeSwitcher();
  
  const graphRef = useRef<HTMLDivElement>(null);
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
  }, [engine]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode || _.isUndefined(cy)) return;
    // if (_.isUndefined(cy)) return;

    // logger.log('Connected edges:', j.connectedEdges())

    cy.$('.open').removeClass('open');

    cy.getElementById(id).addClass('open');

    // TODO: .open class not affecting rendered output

    postVSCodeMessage({
      type: GraphViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
  };

  return <Graph elements={elements} onSelect={onSelect} />;
}
