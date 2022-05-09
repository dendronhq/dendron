import { Theme } from "./theme-classic";

export const getStyles = (
  theme: string,
  themeObj: { [theme: string]: Theme },
  customCSS?: string
) => {
  // Cytoscape's "diamond" node is smaller than it's "circle" node, so
  // this modifier adjusts to make parent and child nodes similarly sized.
  const PARENT_NODE_SIZE_MODIFIER = 1.25;
  return `
  node {
    width: ${themeObj[theme].graph.node.size};
    height: ${themeObj[theme].graph.node.size};
    background-color: ${themeObj[theme].graph.node.color};
    color: ${themeObj[theme].graph.node.label.color};
    label: data(label);
    font-size: ${themeObj[theme].graph.node.label.fontSize};
    min-zoomed-font-size: ${themeObj[theme].graph.node.label.minZoomedFontSize};
    font-weight: ${themeObj[theme].graph.node.label.fontWeight};
    font-family: ${themeObj[theme].graph.node.fontFamily};
  }

  node[color] {
    background-color: data(color);
  }

  edge {
    width: ${themeObj[theme].graph.edge.width};
    line-color: ${themeObj[theme].graph.edge.color};
    ${
      themeObj[theme].graph.edge.targetDistanceFromNode
        ? `target-distance-from-node: ${themeObj[theme].graph.edge.targetDistanceFromNode};`
        : ""
    }
    ${
      themeObj[theme].graph.edge.sourceDistanceFromNode
        ? `source-distance-from-node: ${themeObj[theme].graph.edge.sourceDistanceFromNode};`
        : ""
    }
    ${
      themeObj[theme].graph.edge.sourceEndpoint
        ? `source-endpoint: ${themeObj[theme].graph.edge.sourceEndpoint};`
        : ""
    }
    ${
      themeObj[theme].graph.edge.targetEndpoint
        ? `target-endpoint: ${themeObj[theme].graph.edge.targetEndpoint};`
        : ""
    }
  }

  :selected{
    background-color: ${themeObj[theme].graph.node._selected.color};
    color: ${themeObj[theme].graph.node._selected.color};
  }

  .parent {
    shape: ${themeObj[theme].graph.parent.shape};
    width: ${themeObj[theme].graph.node.size * PARENT_NODE_SIZE_MODIFIER};
    height: ${themeObj[theme].graph.node.size * PARENT_NODE_SIZE_MODIFIER};
    ${
      themeObj[theme].graph.parent.color
        ? `background-color: ${themeObj[theme].graph.parent.color};
    color: ${themeObj[theme].graph.parent.color};
    `
        : ""
    }
    
  }

  .links {
    line-style: ${themeObj[theme].graph.links.linkStyle};
    ${
      themeObj[theme].graph.links.curveStyle
        ? `curve-style: ${themeObj[theme].graph.links.curveStyle};`
        : ""
    }
  }

  .hierarchy {
    ${
      themeObj[theme].graph.hierarchy?.curveStyle
        ? `curve-style: ${themeObj[theme].graph.hierarchy?.curveStyle};`
        : ""
    }
  }

  .hidden--labels {
    label: ;
  }

  .hidden--vault,
  .hidden--regex-allowlist,
  .hidden--regex-blocklist,
  .hidden--stub {
    display: none;
  }
  ${customCSS || ""}
  `;
};
