import _ from "lodash";

export type Theme = {
  graph: {
    node: {
      size: number;
      color: string;
      label: {
        color: string;
        fontSize: number;
        minZoomedFontSize: number;
        fontWeight: number;
      };
      _selected: {
        color: string;
      };
    };
    edge: {
      width: number;
      color: string;
    };
    filterView: {
      margin: string; // likely rem units
      background: string;
      minWidth: string;
      borderRadius: number;
    };
  };
};

// Theme-agnostic styles (font sizes, units, etc.)
const baseTheme: Theme = {
  graph: {
    node: {
      size: 5,
      color: "",
      label: {
        fontSize: 10,
        minZoomedFontSize: 10,
        fontWeight: 400,
        color: "",
      },
      _selected: {
        color: "",
      },
    },
    edge: {
      width: 0.25,
      color: "",
    },
    filterView: {
      margin: "1rem",
      minWidth: "12rem",
      borderRadius: 4,
      background: "",
    },
  },
};

const darkTheme: Theme = {
  graph: {
    node: {
      color: "#B3ABAB",
      size: baseTheme.graph.node.size,
      label: {
        color: "#ffffff",
        fontSize: baseTheme.graph.node.label.fontSize,
        minZoomedFontSize: baseTheme.graph.node.label.minZoomedFontSize,
        fontWeight: baseTheme.graph.node.label.fontWeight,
      },
      _selected: {
        color: "#36B73B",
      },
    },
    edge: {
      color: "#B3ABAB",
      width: baseTheme.graph.edge.width,
    },
    filterView: {
      background: "#303030",
      margin: baseTheme.graph.filterView.margin,
      minWidth: baseTheme.graph.filterView.minWidth,
      borderRadius: baseTheme.graph.filterView.borderRadius,
    },
  },
};

const lightTheme: Theme = {
  graph: {
    node: {
      color: "#666161",
      size: baseTheme.graph.node.size,
      label: {
        color: "#2F3438",
        fontSize: baseTheme.graph.node.label.fontSize,
        minZoomedFontSize: baseTheme.graph.node.label.minZoomedFontSize,
        fontWeight: baseTheme.graph.node.label.fontWeight,
      },
      _selected: {
        color: "#27AC2C",
      },
    },
    edge: {
      color: "#666161",
      width: baseTheme.graph.edge.width,
    },
    filterView: {
      background: "#F5F6F8",
      margin: baseTheme.graph.filterView.margin,
      minWidth: baseTheme.graph.filterView.minWidth,
      borderRadius: baseTheme.graph.filterView.borderRadius,
    },
  },
};

const AntThemes: {
  [theme: string]: Theme;
} = {
  dark: darkTheme,
  light: lightTheme,
};

export default AntThemes;
