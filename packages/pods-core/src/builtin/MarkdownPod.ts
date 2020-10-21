import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { dendronRefsPlugin, ParserUtilsV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import {
  PodConfigEntry,
  PublishConfig,
  PublishPodBaseV3,
  PublishPodOpts,
} from "../base";

const ID = "dendron.markdown";

export class MarkdownPublishPod extends PublishPodBaseV3<PublishConfig> {
  static id: string = ID;
  static description: string = "publish markdown";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string",
      },
    ];
  };

  async plant(opts: PublishPodOpts<PublishConfig>): Promise<void> {
    await this.initEngine();
    const cleanOpts = _.defaults(opts, { config: this.getDefaultConfig() });
    //const { dest } = cleanOpts.config;
    const { fname } = cleanOpts;
    const note = NoteUtilsV2.getNoteByFname(fname, this.engine.notes, {
      throwIfEmpty: true,
    }) as NotePropsV2;
    const root = this.engine.vaults[0];
    const renderWithOutline = false;
    const remark = ParserUtilsV2.getRemark().use(dendronRefsPlugin, {
      root,
      renderWithOutline,
      replaceRefs: { engine: this.engine },
    });
    const out = remark.processSync(note.body).toString();
    console.log(out);
    //fs.writeFileSync(dest, note, { encoding: "utf8" });
  }
}
