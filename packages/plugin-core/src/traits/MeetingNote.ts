import {
  IntermediateDendronConfig,
  NoteTrait,
  OnCreateContext,
  onWillCreateProps,
  SetNameModifierResp,
} from "@dendronhq/common-all";
import { DendronClientUtilsV2 } from "../clientUtils";
import { IDendronExtension } from "../dendronExtensionInterface";

export class MeetingNote implements NoteTrait {
  id: string = "meetingNote";
  getTemplateType: any;

  _config: IntermediateDendronConfig;
  _ext: IDendronExtension;

  constructor(config: IntermediateDendronConfig, ext: IDendronExtension) {
    this._config = config;
    this._ext = ext;
  }

  get OnWillCreate(): onWillCreateProps {
    return {
      setNameModifier(this, _opts: OnCreateContext): SetNameModifierResp {
        const name = DendronClientUtilsV2.getMeetingNoteName();

        return { name, promptUserForModification: true };
      },
    };
  }
}
