import { baseTheme, Theme } from "./theme-classic";

const monokaiBasicTheme = {
  links: {
    curveStyle: "bezier",
  },
  hierarchy: {
    curveStyle: "bezier",
  },
  edge: {
    width: 0.5,
    targetDistanceFromNode: 5,
    sourceDistanceFromNode: 5,
    targetEndpoint: "outside-to-line-or-label",
    sourceEndpoint: "outside-to-line-or-label",
  },
};

const darkTheme: Theme = {
  graph: {
    node: {
      color: "#ff6188",
      size: baseTheme.graph.node.size,
      fontFamily: "cursive",
      label: {
        ...baseTheme.graph.node.label,
        color: "#ff6188",
      },
      _selected: {
        color: "#fc9867",
      },
    },
    edge: {
      ...monokaiBasicTheme.edge,
      color: "#78dce8",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#303030",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "#a9dc76",
    },
    links: {
      ...baseTheme.graph.links,
      ...monokaiBasicTheme.links,
    },
    hierarchy: {
      ...monokaiBasicTheme.hierarchy,
    },
  },
};

const lightTheme: Theme = {
  graph: {
    node: {
      color: "#b7306c",
      size: baseTheme.graph.node.size,
      fontFamily: "cursive",
      label: {
        ...baseTheme.graph.node.label,
        color: "#b7306c",
      },
      _selected: {
        color: "#d8704b",
      },
    },
    edge: {
      ...monokaiBasicTheme.edge,
      color: "#3c8aa7",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#F5F6F8",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "#639e3b",
    },
    links: {
      ...baseTheme.graph.links,
      ...monokaiBasicTheme.links,
    },
    hierarchy: {
      ...monokaiBasicTheme.hierarchy,
    },
  },
};

const MonokaiTheme: {
  [theme: string]: Theme;
} = {
  dark: darkTheme,
  light: lightTheme,
};

export default MonokaiTheme;
