import { DNodeProps } from "."

export type NoteType = {
  id: string;

  // Returns a JSON like complex object
  getTemplateType: any | undefined;

  //TODO
  //setTemplateType? What if user sets a type for their daily journal note for example?

  /**
   * Callback Props that occur prior to the creation of the note
   */
  onWillCreate?: onWillCreateProps;

  /**
   * Callback Props that occur during the creation of the note such as modifying frontmatter or contents
   */
  onCreate?: onCreateProps;

  //TODO: Missing Properties
  // Vault Specifier?
}

export type onWillCreateProps = {
  // TODO: Add params: selected text; clipboard text
  //configurable_level_1
  setNameModifier?(noteProps: Partial<DNodeProps>):string;

  //TODO: Spec this one out better:
  modifyCurrentNote?(noteProps: DNodeProps, selected: string): string; // idea here is how do we implement selectionextract functionality of scratch notes
}

export type onCreateProps = {
  //TODO: Should these be combined into one? Is String the right type for vault, probably not. Should we use DNoteProps for note?
  //configurable_level_1
  setTitle(noteName: string, hierarchy: string, vault: string): string;

  // We shouldn't choose apply template; should be more generic
  // applyTemplate(templateName: string): void;

  //TODO: What are the arguments?
  //configurable_level_1 - via a template
  setBody?(): string;

  //TODO: needs to return a prop array of some sort
  setFrontmatter?(): string;
}

export type onDescendantLifecycleEvent = {

}

export type onSiblingLifecycleEvent = {

}