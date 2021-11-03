import _ from "lodash";

export type DendronTheme = {
  primaryColor: string;
  bodyBackground: string;
  componentBackground: string;
  layoutBodyBackground: string;
  borderRadiusBase: string;
  layoutHeaderBackground: string;
};

const DEFAULT_THEMES = {
  light: {
    primaryColor: "#43B02A",
    bodyBackground: "#ffffff",
    componentBackground: "#ffffff",
    layoutBodyBackground: "#ffffff",
    borderRadiusBase: "4px",
    layoutHeaderBackground: "#F5F7F9",
  },
};

export class ThemeUtils {
  static getTheme(name: string): DendronTheme | undefined {
    return _.get(DEFAULT_THEMES, name, undefined);
  }
}
