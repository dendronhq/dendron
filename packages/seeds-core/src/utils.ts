import { NoteProps } from "@dendronhq/common-all";
import _ from "lodash";
import { SourceAttr } from "./basev2";

export class SeedUtils {
  static async addToSource(note: NoteProps, source: SourceAttr) {
    if (!note.custom) {
      note.custom = {};
    }
    if (!note.custom.sources) {
      note.custom.sources = [] as SourceAttr[];
    }
    if (!_.find(note.custom.sources, { url: source.url })) {
      note.custom.sources.push(source);
    }
  }
}
