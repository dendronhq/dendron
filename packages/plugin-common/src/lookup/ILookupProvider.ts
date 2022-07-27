import { NoteQuickInput } from "@dendronhq/common-all";
import { provideItemsProps } from "./NoteLookupProvider";

export interface ILookupProvider {
  provideItems(opts: provideItemsProps): Promise<NoteQuickInput[] | undefined>;
}
