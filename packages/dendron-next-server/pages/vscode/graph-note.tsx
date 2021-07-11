import { postVSCodeMessage } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { EventHandler } from "cytoscape";
import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageType,
  NoteProps,
} from "@dendronhq/common-all";
import Graph from "../../components/graph";
import { graphConfig, GraphConfig } from "../../lib/graph";
import useGraphElements from "../../hooks/useGraphElements";
import { DendronProps } from "../../lib/types";

export default function FullNoteGraph({ engine, ide }: DendronProps) {
  const [config, setConfig] = useState<GraphConfig>(graphConfig.note);

  const [activeNote, setActiveNote] = useState<NoteProps>();
  const [disregardActiveNote, setDisregardActiveNote] = useState(false);
  const elements = useGraphElements({
    type: "note",
    engine,
    config,
    noteActive: activeNote,
  });

  useEffect(() => {
    if (ide.noteActive && !disregardActiveNote) setActiveNote(ide.noteActive);
    else if (disregardActiveNote) setDisregardActiveNote(false);
  }, [ide.noteActive]);

  // Update config
  useEffect(() => {
    if (!_.isUndefined(elements)) {
      setConfig((c) => ({
        ...c,
        "information.nodes": {
          value: elements.nodes.length,
          mutable: false,
        },
        "information.edges-hierarchy": {
          value: elements.edges.hierarchy ? elements.edges.hierarchy.length : 0,
          mutable: false,
          label: "Hierarchical Edges",
        },
        "information.edges-links": {
          value: elements.edges.links ? elements.edges.links.length : 0,
          mutable: false,
          label: "Linked Edges",
        },
      }));
    }
  }, [elements]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode || !engine.notes) return;

    // The ShowNoteGraph command sets the active text editor to the first window when opening a note.
    // This causes the active note to change unexpectedly, causing a jarring graph render.
    // This flag allows the note graph to ignore that first unwanted change
    setDisregardActiveNote(true);

    setActiveNote(engine.notes[id]);
    postVSCodeMessage({
      type: GraphViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
  };

  return (
    <Graph
      elements={elements}
      onSelect={onSelect}
      config={config}
      setConfig={setConfig}
      engine={engine}
      ide={ide}
    />
  );
}
