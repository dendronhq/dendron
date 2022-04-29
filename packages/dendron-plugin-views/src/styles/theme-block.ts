import { baseTheme, Theme } from "./theme-classic";

const blockBasicTheme = {
  links: {
    curveStyle: "unbundled-bezier",
  },
  hierarchy: {
    curveStyle: "taxi",
  },
  edge: {
    width: 0.5,
    color: "#B3ABAB",
    targetDistanceFromNode: 5,
    sourceDistanceFromNode: 5,
  },
};

const darkTheme: Theme = {
  graph: {
    node: {
      color: "#BB86FC",
      size: baseTheme.graph.node.size,
      fontFamily: "sans-serif",
      label: {
        ...baseTheme.graph.node.label,
        color: "#BB86FC",
      },
      _selected: {
        color: "#C7FC86",
      },
    },
    edge: {
      ...blockBasicTheme.edge,
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#303030",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "coral",
    },
    links: {
      ...baseTheme.graph.links,
      ...blockBasicTheme.links,
    },
    hierarchy: {
      ...blockBasicTheme.hierarchy,
    },
  },
};

const lightTheme: Theme = {
  graph: {
    node: {
      color: "#8800FC",
      size: baseTheme.graph.node.size,
      fontFamily: "sans-serif",
      label: {
        ...baseTheme.graph.node.label,
        color: "#8800FC",
      },
      _selected: {
        color: "#7DB031",
      },
    },
    edge: {
      ...blockBasicTheme.edge,
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#F5F6F8",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "coral",
    },
    links: {
      ...baseTheme.graph.links,
      ...blockBasicTheme.links,
    },
    hierarchy: {
      ...blockBasicTheme.hierarchy,
    },
  },
};

const BlockTheme: {
  [theme: string]: Theme;
} = {
  dark: darkTheme,
  light: lightTheme,
};

export default BlockTheme;
