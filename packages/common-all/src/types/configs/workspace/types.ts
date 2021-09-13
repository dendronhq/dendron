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
