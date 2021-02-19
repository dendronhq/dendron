import { BasePodExecuteOpts, NoteUtilsV2 } from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV4 } from "@dendronhq/engine-server";
import { PublishPod, PublishPodCleanConfig } from "../basev2";

const ID = "dendron.html";

export class HTMLPublishPod extends PublishPod {
  static id: string = ID;
  static description: string = "publish html";

  async plant(opts: BasePodExecuteOpts<PublishPodCleanConfig>): Promise<any> {
    const { config, engine } = opts;
    const { fname, vault } = config;
    const note = NoteUtilsV2.getNoteByFnameV4({
      fname,
      notes: engine.notes,
      vault,
    });
    const { data: econfig } = await engine.getConfig();
    const proc = MDUtilsV4.procFull({
      engine,
      dest: DendronASTDest.HTML,
      vault,
      fname,
      shouldApplyPublishRules: false,
      publishOpts: {
        insertTitle: econfig!.useFMTitle!,
      },
      mathOpts: { katex: true },
      config: econfig!,
      mermaid: econfig!.mermaid,
    });
    const { contents } = await MDUtilsV4.procRehype({
      proc,
      mathjax: true,
    }).process(note!.body);
    return contents as string;
  }
}
