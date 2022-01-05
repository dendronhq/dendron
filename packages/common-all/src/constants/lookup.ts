import { AllModifierType } from "../types/lookup";

export const MODIFIER_DESCRIPTIONS: {
  [key in Exclude<AllModifierType, "none"> as string]: string;
} = {
  selection2link:
    "Highlighted text will be turned into a wikilink to the newly created note",
  selectionExtract:
    "Highlighted text will be copied over to the new note and a note reference will be left in the original note",
  selection2Items:
    "Wikilinks in highlighted text will be used to create selectable items in lookup",
  journal: "",
  scratch: "",
  task: "",
  horizontal: "Open lookup result to the side",
  directChildOnly:
    "Limits lookup depth to one level and filters out stub notes",
  multiSelect: "Select multiple notes at once",
  copyNoteLink: "Add selected notes to the clipboard as wikilinks",
};
