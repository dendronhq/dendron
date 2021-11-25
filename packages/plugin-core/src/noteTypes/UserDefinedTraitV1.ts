/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import {
  NoteTrait,
  onCreateProps,
  onWillCreateProps,
} from "@dendronhq/common-all";

/**
 * A NoteTrait that will execute end-user defined javascript code. TODO: Support
 * hot reload (user doesn't need to reload window in order for their changes to
 * take effect)
 */
export class UserDefinedTraitV1 implements NoteTrait {
  id: string;
  getTemplateType: any;
  scriptPath: string;

  OnCreate?: onCreateProps;
  OnWillCreate?: onWillCreateProps;

  /**
   *
   * @param typeId ID for the note type
   * @param scriptPath - path to the .js file that will be dynamically run
   */
  constructor(typeId: string, scriptPath: string) {
    this.id = typeId;
    this.scriptPath = scriptPath;

    this.OnCreate = UserDefinedTraitV1.getOnCreateProps(scriptPath);
    this.OnWillCreate = UserDefinedTraitV1.getOnWillCreateProps(scriptPath);
  }

  private static getOnWillCreateProps(noteTypeScriptPath: string) {
    const req: NoteTrait = require(noteTypeScriptPath);
    return req.OnWillCreate;
  }

  private static getOnCreateProps(noteTypeScriptPath: string) {
    const req: NoteTrait = require(noteTypeScriptPath);
    return req.OnCreate;
  }
}
