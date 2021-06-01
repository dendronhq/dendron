import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from '@dendronhq/common-frontend';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  EdgeDefinition,
  ElementsDefinition,
  EventHandler,
} from 'cytoscape';
import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageType,
} from '@dendronhq/common-all';
import Graph from '../../components/graph';

export default function FullGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const notes = engine ? engine.notes || {} : {};
  
  const logger = createLogger('Graph');
  logger.info({ ctx: 'Graph', notes });
  
  const [elements, setElements] = useState<ElementsDefinition>();
  
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
    if (!isNode) return;
    // if (_.isUndefined(cy)) return;

    // logger.log('Connected edges:', j.connectedEdges())

    // cy.$('.open').removeClass('open');

    // cy.getElementById(id).addClass('open');

    logger.log(id, source)

    postVSCodeMessage({
      type: GraphViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
  };

  return <Graph elements={elements} onSelect={onSelect} />;
}
