import { ShowcaseEntry } from "@dendronhq/engine-server";
import { IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
import { MeetingNotesTip } from "./MeetingNotesTip";
import {
  createSimpleTipOfDayMsg,
  createTipOfDayMsgWithDocsLink,
} from "./TipFactory";
import { GraphThemeTip } from "./GraphThemeTip";

const AUTOCOMPLETE_TIP = createSimpleTipOfDayMsg(
  ShowcaseEntry.AutocompleteTip,
  "Lookup has Autocomplete. Try pressing 'tab' the next time you have lookup open."
);

const TAGS_TIP = createTipOfDayMsgWithDocsLink({
  showcaseEntry: ShowcaseEntry.TagsTip,
  displayMessage:
    "Quickly add a tag in your notes by typing '#my-tag-name'. Tags are just notes in Dendron, and you can view all references to a tag by examining the backlinks of that tag",
  docsUrl: "https://wiki.dendron.so/notes/8bc9b3f1-8508-4d3a-a2de-be9f12ef1821",
  confirmText: "See Details",
});

const RENAME_HEADER = createSimpleTipOfDayMsg(
  ShowcaseEntry.RenameHeader,
  "If you rename a header with the 'Dendron Rename Header' command, all links pointing to that header also get updated."
);

const TASK_MANAGEMENT = createTipOfDayMsgWithDocsLink({
  showcaseEntry: ShowcaseEntry.TaskManagement,
  displayMessage: "You can turn bullet points into to-dos using task notes.",
  confirmText: "More info",
  docsUrl: "https://wiki.dendron.so/notes/8hwz4bvyy556frx9y04c1cv/",
});

const BLOCK_REFS = createSimpleTipOfDayMsg(
  ShowcaseEntry.BlockRefs,
  "You can link to a particular paragraph by selecting a block of text and running the 'Copy Note Link' command."
);

const HEADER_REFS = createSimpleTipOfDayMsg(
  ShowcaseEntry.HeaderRefs,
  "You can link to a particular header by placing the cursor in the header text and then running the 'Copy Note Link' command."
);

const INSERT_NOTE_LINK = createTipOfDayMsgWithDocsLink({
  showcaseEntry: ShowcaseEntry.InsertNoteLink,
  displayMessage:
    "The 'Insert Note Link' command is another way to create wikilinks with lookup and different options for the link alias.",
  confirmText: "See Docs",
  docsUrl:
    "https://wiki.dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f47/#insert-note-link",
});

/**
 * All messages in the rotation to be displayed.
 */
export const ALL_FEATURE_SHOWCASES: IFeatureShowcaseMessage[] = [
  new MeetingNotesTip(),
  AUTOCOMPLETE_TIP,
  TAGS_TIP,
  HEADER_REFS,
  RENAME_HEADER,
  TASK_MANAGEMENT,
  BLOCK_REFS,
  INSERT_NOTE_LINK,
  new GraphThemeTip(),
];
