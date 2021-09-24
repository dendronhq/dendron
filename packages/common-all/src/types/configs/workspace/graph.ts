/**
 * Namespace for all graph related configurations.
 */
export type DendronGraphConfig = {
  zoomSpeed: number;
};

/**
 * Generates default {@link DendronGraphConfig}
 * @returns DendronGraphConfig
 */
export function genDefaultGraphConfig(): DendronGraphConfig {
  return {
    zoomSpeed: 1,
  };
}
