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

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

// Theme-agnostic styles (font sizes, units, etc.)
const baseTheme: RecursivePartial<Theme> = {
  graph: {
    node: {
      size: 5,
      label: {
        fontSize: 10,
        minZoomedFontSize: 10,
        fontWeight: 400,
      },
    },
    edge: {
      width: 0.25,
    },
    filterView: {
      margin: "1rem",
      minWidth: "12rem",
      borderRadius: 4,
    },
  },
};

const darkTheme: RecursivePartial<Theme> = _.merge(_.cloneDeep(baseTheme), {
  graph: {
    node: {
      color: "#807B7B",
      label: {
        color: "#ffffff",
      },
      _selected: {
        color: "#36B73B",
      },
    },
    edge: {
      color: "#807B7B",
    },
    filterView: {
      background: "#303030",
    },
  },
});

const lightTheme: RecursivePartial<Theme> = _.merge(_.cloneDeep(baseTheme), {
  graph: {
    node: {
      color: "#999393",
      label: {
        color: "#2F3438",
      },
      _selected: {
        color: "#27AC2C",
      },
    },
    edge: {
      color: "#999393",
    },
    filterView: {
      background: "#F5F6F8",
    },
  },
});

const AntThemes: {
  [theme: string]: Theme;
} = {
  dark: darkTheme as Theme,
  light: lightTheme as Theme,
};

export default AntThemes;
