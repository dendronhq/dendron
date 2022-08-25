
/**
 * Define your custom trait behavior in this file by modifying the functions in
 * 'module.exports' below. See
 * https://wiki.dendron.so/notes/EQoaBI8A0ZcswKQC3UMpO/ for examples and
 * documentation.
 *
 * NOTE: This is an alpha feature, so this API may have breaking changes in
 * future releases.
 */

/**
 * @typedef OnCreateContext Properties that can be utilized during note creation
 * @type {object}
 * @property {string} currentNoteName The name of the currently opened Dendron
 * note, or the specified name of the note about to be created
 * @property {string} selectedText Any currently selected text in the editor
 * @property {number} clipboard The current contents of the clipboard
 */

/**
 * @typedef SetNameModifierReturnType Properties that can be utilized during
 * note creation
 * @type {object}
 * @property {string} name The name to use for the note
 * @property {boolean} promptUserForModification if true, the modified name will
 * appear in a lookup control to allow the user to further edit the note name
 * before confirming.
 */

module.exports = {
  OnWillCreate: {
    /**
     * Specify behavior to modify the name of the note.
     * @param {OnCreateContext} props
     * @returns {SetNameModifierReturnType} the name to use for the note. If
     * promptUserForModification is true, the modified name will appear in a
     * lookup control to allow the user to further edit the note name before
     * confirming.
     */
    setNameModifier(props) {
      // This example sets a prefix of 'my-hierarchy', and then adds a date
      // hierarchy using the luxon module. PromptUserForModification is set to
      // true so that the user has the option to alter the title name before
      // creating the note.
      return {
        // luxon is available for Date functions. See
        // https://moment.github.io/luxon/api-docs/index.html for documentation
        name: "my-hierarchy." + luxon.DateTime.local().toFormat("yyyy.MM.dd"),
        promptUserForModification: true,
      };
    },
  },
  OnCreate: {
    /**
     * Specify behavior for altering the title of the note when it is created.
     * @param {OnCreateContext} props
     * @returns {string} the title to set for the note
     */
    setTitle(props) {
      // This example will use the currentNoteName property, extract the
      // yyyy.MM.dd date portion of the note name, and then reformat it with
      // dashes.
      return props.currentNoteName.split(".").slice(-3).join("-");
    },
    /**
     * Set a note template to be applied. This method is optional, uncomment out
     * the lines below if you want to apply a template.
     * @returns the name of the desired template note from this function
     */
    // setTemplate: () => {
    //   return "root";
    // },
  },
};
