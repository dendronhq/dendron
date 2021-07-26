import "../styles/scss/main.scss";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import type { AppProps } from "next/app";
import { BasicLayout } from "@dendronhq/common-frontend";

const themes = {
  dark: `/dark-theme.css`,
  light: `/light-theme.css`,
};

function MyApp({ Component, pageProps }: AppProps) {
  const defaultTheme = "light";
  return (
    <ThemeSwitcherProvider themeMap={themes} defaultTheme={defaultTheme}>
      <BasicLayout>
        <Component {...pageProps} />
      </BasicLayout>
    </ThemeSwitcherProvider>
  );
}
export default MyApp;
