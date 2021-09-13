/**
 * Namespace for configuring {@link RandomNoteCommand}
 */
export type RandomNoteConfig = {
  include: string[];
  exclude: string[];
};

/**
 * Generates default {@link RandomNoteConfig}
 * @returns RandomNoteConfig
 */
export function genDefaultRandomNoteConfig(): RandomNoteConfig {
  return {
    include: [],
    exclude: [],
  };
}
