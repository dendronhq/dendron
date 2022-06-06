/**
 * Namespace for all graph related configurations.
 */
export type DendronGraphConfig = {
  zoomSpeed: number;
  /**
   * If true, create a note if it hasn't been created already when clicked on a graph node
   */
  createStub: boolean;
};

/**
 * Generates default {@link DendronGraphConfig}
 * @returns DendronGraphConfig
 */
export function genDefaultGraphConfig(): DendronGraphConfig {
  return {
    zoomSpeed: 1,
    createStub: false,
  };
}
