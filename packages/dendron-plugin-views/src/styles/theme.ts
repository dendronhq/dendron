import { ThemeType } from "@dendronhq/common-all";

export const getThemeType = (theme?: string) => {
  if (theme === "dark") {
    return ThemeType.DARK;
  }
  return ThemeType.LIGHT;
};