import { IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
import { MeetingNotesTip } from "./MeetingNotesTip";
import { SchemasTip } from "./SchemasTip";

/**
 * All messages in the rotation to be displayed.
 */
export const ALL_FEATURE_SHOWCASES: IFeatureShowcaseMessage[] = [
  new MeetingNotesTip(),
  new SchemasTip(),
];
