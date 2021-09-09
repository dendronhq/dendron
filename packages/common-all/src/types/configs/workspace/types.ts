import { DendronConfigEntry } from "../base";

/**
 * Enum definition of possible note add behavior values.
 */
export enum NoteAddBehaviorEnum {
  childOfDomain = "childOfDomain",
  childOfDomainNamespace = "childOfDomainNamespace",
  childOfCurrent = "childOfCurrent",
  asOwnDomain = "asOwnDomain",
}

/**
 * String literal type generated from {@link NoteAddBehaviorEnum}
 */
export type NoteAddBehavior = keyof typeof NoteAddBehaviorEnum;

/**
 * Constants for possible note add behaviors.
 * Each key of {@link NoteAddBehavior} is mapped to a {@link DendronConfigEntry}
 * which specifies the value, label, description of possible note add behaviors.
 *
 * These are used to generate user friendly descriptions in the configuration.
 */
export const ADD_BEHAVIOR: {
  [key in NoteAddBehavior]: DendronConfigEntry<string>;
} = {
  childOfDomain: {
    value: "childOfDomain",
    label: "child of domain",
    desc: "Note is added as the child of domain of the current hierarchy",
  },
  childOfDomainNamespace: {
    value: "childOfDomainNamespace",
    label: "child of domain namespace",
    desc: "Note is added as child of the namespace of the current domain if it has a namespace. Otherwise added as child of domain.",
  },
  childOfCurrent: {
    value: "childOfCurrent",
    label: "child of current",
    desc: "Note is added as a child of the current open note",
  },
  asOwnDomain: {
    value: "asOwnDomain",
    label: "as own domain",
    desc: "Note is created under the domain specified by journal name value",
  },
};
