/**
 * Namespace for all graph related configurations.
 */
export type DendronGraphConfig = {
  zoomSpeed: number;
};

export const GRAPH = {
  ZOOM_SPEED: {
    label: "zoom speed",
    desc: "The speed at which the graph zooms in and out. Lower is slower, higher is faster.",
  },
};

export function genDefaultGraphConfig(): DendronGraphConfig {
  return {
    zoomSpeed: 1,
  };
}
