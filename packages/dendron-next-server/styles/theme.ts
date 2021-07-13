import { theme as defaultTheme, extendTheme } from "@chakra-ui/react";

export enum ThemeType {
  LIGHT = "LIGHT",
  DARK = "DARK",
}

export const getThemeType = (theme?: string) => {
  if (theme === "dark") {
    return ThemeType.DARK;
  }
  return ThemeType.LIGHT;
};

export const theme = extendTheme({
  config: {
    useSystemColorMode: true,
  },

  colors: {
    positive: defaultTheme.colors.green,

    brand: {
      // Generated with https://copypalette.app/ via #69B160
      50: "#D2E8CF",
      100: "#B9DBB4",
      200: "#A2CF9C",
      300: "#8DC486",
      400: "#7ABA72",
      500: "#69B160",
      600: "#5AA551",
      700: "#519549",
      800: "#498642",
      900: "#42793B",
    },
  },

  styles: {
    global: {
      "html, body, #__next": {
        height: "100%",
        minHeight: "100%",
      },
    },
  },

  components: {
    Link: {
      baseStyle: {
        textDecoration: "underline",
        color: "blue.500",
      },
    },
  },
});
