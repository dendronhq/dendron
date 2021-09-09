export type RandomNoteConfig = {
  include: string[];
  exclue: string[];
};

/**
 * Constants / functions that produce constants for
 * possible random note configurations.
 */
export const RANDOM_NOTE = {
  INCLUDE: {
    label: "hierarchies to include",
    desc: "Hierarchies to include when opening a random note",
  },
  EXCLUDE: {
    label: "hierarchies not to include",
    desc: "Hierarchies not to include when opening a random note",
  },
};

export function genDefaultRandomNoteConfig(): RandomNoteConfig | undefined {
  return;
}
