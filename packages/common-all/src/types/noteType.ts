/**
 * Note Type Interface TODO: this is a work in progress; more properties will be
 * added as the note type system functionality expands
 */
export type NoteType = {
  id: string;

  /**
   * Callback Props that occur prior to the creation of the note
   */
  onWillCreate?: onWillCreateProps;

  /**
   * Callback Props that occur during the creation of the note such as modifying frontmatter or contents
   */
  onCreate?: onCreateProps;
};

/**
 * These properties are available for use when the note is being created.
 */
export type OnCreateContext = {
  /**
   * The value of this varies on the context.  During onWillCreate, this
   * contains the name of the Dendron note that is currently in focus. The name
   * includes the entire hierarchy. Undefined if a Dendron note is not currently
   * in focus. During onCreate, this will contain the name of the note about to
   * be created.
   */
  currentNoteName?: string;

  /**
   * Contains any portion of text that is highlighted in the current editor.
   */
  selectedText?: string;

  /**
   * Contains clipboard contents.
   */
  clipboard: string;
};

export type SetNameModifierResp = {
  /**
   * The modified name for the note
   */
  name: string;

  /**
   * If true, the user will be prompted with an input box, where they can
   * further modify the note name. The default value in the input box will be
   * set to the `name` property.
   */
  promptUserForModification: boolean;
};

export type onWillCreateProps = {
  setNameModifier?(props: OnCreateContext): SetNameModifierResp;
};

export type onCreateProps = {
  //TODO: Should these be combined into one? Is String the right type for vault, probably not. Should we use DNoteProps for note?
  //configurable_level_1
  setTitle?(props: OnCreateContext): string;

  // We shouldn't choose apply template; should be more generic
  // applyTemplate(templateName: string): void;

  //TODO: What are the arguments?
  //configurable_level_1 - via a template
  setBody?(): string;

  //TODO: needs to return a prop array of some sort
  setFrontmatter?(): string;
};

export type onDescendantLifecycleEvent = {};

export type onSiblingLifecycleEvent = {};
