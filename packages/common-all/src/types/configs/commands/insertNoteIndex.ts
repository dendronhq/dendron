/**
 * Namespace for configuring {@link InsertNoteIndexCommand}
 */
export type InsertNoteIndexConfig = {
  enableMarker: boolean;
};

/**
 * Generates default {@link InsertNoteIndexConfig}
 * @returns InsertNoteIndexConfig
 */
export function genDefaultInsertNoteIndexConfig(): InsertNoteIndexConfig {
  return {
    enableMarker: false,
  };
}
