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

/**
 * DendronConfigEntryCollection
 * type for an object that has the same properties of T
 * mapped to it, that can have any value for each key.
 * Any optional properties are required here.
 *
 * This is used as the type signature of the object that
 * maps config properties to their respective DendronConfigEntry
 */
export type DendronConfigEntryCollection<T> = {
  [Property in keyof T]-?: any;
};
