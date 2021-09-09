/**
 * DendronConfigEntry
 * Holds the value, label, and description of individual configuration entries.
 *
 * For config entries that can be an arbitrary value, only specify the label and description.
 * For config entries that have pre-defined choices, provide the value as well as label and description specific to that value.
 */
export type DendronConfigEntry<T> = {
  value?: T;
  label: string;
  desc: string;
};
