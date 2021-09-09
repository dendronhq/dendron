/**
 * Namespace for configuring {@link InsertNoteCommand}
 */
export type InsertNoteConfig = {
  value: string;
};

/**
 * Constants / functions that produce constants for
 * possible insert note configurations.
 */
export const INSERT_NOTE = {
  VALUE: {
    label: "initial value",
    desc: "Initial value that will be filled when prompted.",
  },
};

/**
 * Generates default {@link InsertNoteConfig}
 * @returns InsertNoteConfig
 */
export function genDefaultInsertNoteConfig(): InsertNoteConfig {
  return {
    value: "templates",
  };
}
