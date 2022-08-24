/**
 * Note Trait Interface TODO: this is a work in progress; more properties will be
 * added as the note type system functionality expands
 *  ^fgscb0hek3bg
 */
export type NoteTrait = {
  id: string;

  /**
   * Callback Props that occur prior to the creation of the note
   */
  OnWillCreate?: onWillCreateProps;

  /**
   * Callback Props that occur during the creation of the note such as modifying frontmatter or contents
   */
  OnCreate?: onCreateProps;
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
  /**
   * Function whose return value will be used as the title of the note
   * @param props
   */
  setTitle?(props: OnCreateContext): string;

  /**
   * Set a note template to be applied. Return the fname of the desired template
   * note from this function
   */
  setTemplate?(): string;

  //TODO: What are the arguments? Also - reconcile this functionality with
  //setTemplate, as both modify body contents.
  // configurable_level_1 - via a template
  setBody?(): Promise<string>;

  //TODO: needs to return a prop array of some sort
  setFrontmatter?(): string;

  /**
   * Returns the name of the vault that the note will be created in
   */
  setVault?(): string;
};

export type onDescendantLifecycleEvent = {};

export type onSiblingLifecycleEvent = {};
