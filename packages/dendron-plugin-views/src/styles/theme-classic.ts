export type Theme = {
  graph: {
    node: {
      size: number;
      color: string;
      fontFamily?: string;
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
      targetDistanceFromNode?: number;
      sourceDistanceFromNode?: number;
      sourceEndpoint?: string;
      targetEndpoint?: string;
    };
    filterView: {
      margin: string; // likely rem units
      background: string;
      minWidth: string;
      borderRadius: number;
    };
    parent: {
      color?: string;
      shape: string;
    };
    links: {
      linkStyle: string;
      curveStyle?: string;
    };
    hierarchy?: {
      curveStyle: string;
    };
  };
};

export const PARENT_NODE_SIZE_MODIFIER = 1.25;

// Theme-agnostic styles (font sizes, units, etc.)
export const baseTheme: Theme = {
  graph: {
    node: {
      size: 5,
      color: "",
      label: {
        fontSize: 8,
        minZoomedFontSize: 32,
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
    links: {
      linkStyle: "dashed",
    },
    parent: {
      shape: "diamond",
    },
  },
};

const darkTheme: Theme = {
  graph: {
    node: {
      color: "#B3ABAB",
      size: baseTheme.graph.node.size,
      fontFamily: "sans-serif",
      label: {
        ...baseTheme.graph.node.label,
        color: "#ffffff",
      },
      _selected: {
        color: "#36B73B",
      },
    },
    edge: {
      ...baseTheme.graph.edge,
      color: "#B3ABAB",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#303030",
    },
    parent: {
      ...baseTheme.graph.parent,
    },
    links: {
      ...baseTheme.graph.links,
    },
  },
};

const lightTheme: Theme = {
  graph: {
    node: {
      color: "#666161",
      size: baseTheme.graph.node.size,
      fontFamily: "sans-serif",
      label: {
        ...baseTheme.graph.node.label,
        color: "#2F3438",
      },
      _selected: {
        color: "#27AC2C",
      },
    },
    edge: {
      ...baseTheme.graph.edge,
      color: "#666161",
    },
    filterView: {
      ...baseTheme.graph.filterView,
      background: "#F5F6F8",
    },
    parent: {
      ...baseTheme.graph.parent,
    },
    links: {
      ...baseTheme.graph.links,
    },
  },
};

const ClassicTheme: {
  [theme: string]: Theme;
} = {
  dark: darkTheme,
  light: lightTheme,
};

export default ClassicTheme;
