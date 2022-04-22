import { baseTheme, Theme } from "./theme-default";

const classicBasicTheme = {
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
      color: "#AC2065",
      size: baseTheme.graph.node.size,
      fontFamily: "cursive",
      label: {
        ...baseTheme.graph.node.label,
        color: "#AC2065",
      },
      _selected: {
        color: "coral",
      },
    },
    edge: {
      ...classicBasicTheme.edge,
      color: "#5CBAC5",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#303030",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "#27AC2C",
    },
    links: {
      ...baseTheme.graph.links,
      ...classicBasicTheme.links,
    },
    hierarchy: {
      ...classicBasicTheme.hierarchy,
    },
  },
};

const lightTheme: Theme = {
  graph: {
    node: {
      color: "#AC2065",
      size: baseTheme.graph.node.size,
      fontFamily: "cursive",
      label: {
        ...baseTheme.graph.node.label,
        color: "#AC2065",
      },
      _selected: {
        color: "coral",
      },
    },
    edge: {
      ...classicBasicTheme.edge,
      color: "#5CBAC5",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#F5F6F8",
    },
    parent: {
      ...baseTheme.graph.parent,
      color: "#27AC2C",
    },
    links: {
      ...baseTheme.graph.links,
      ...classicBasicTheme.links,
    },
    hierarchy: {
      ...classicBasicTheme.hierarchy,
    },
  },
};

const ClassicThemes: {
  [theme: string]: Theme;
} = {
  dark: darkTheme,
  light: lightTheme,
};

export default ClassicThemes;
