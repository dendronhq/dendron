/*
 * Reference for ant default values https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
 */

const SIDER = {
  COLLAPSED_WIDTH: 0,
  WIDTH: 200,
  PADDING: {
    LEFT: 24,
  },
  INDENT: 10,
};

const HEADER = {
  HEIGHT: 64,
};

const LAYOUT = {
  PADDING: 24,
  BREAKPOINTS: {
    xs: "480px",
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px",
    xxl: "1600px",
  },
  CONTENT_MAX_WIDTH: 960,
};

export const DENDRON_STYLE_CONSTANTS = {
  LAYOUT,
  HEADER,
  SIDER,
};
