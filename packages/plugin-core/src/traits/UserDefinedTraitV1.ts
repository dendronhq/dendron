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
   * @param traitId ID for the note type
   * @param scriptPath - path to the .js file that will be dynamically run
   */
  constructor(traitId: string, scriptPath: string) {
    this.id = traitId;
    this.scriptPath = scriptPath;

    this.OnCreate = UserDefinedTraitV1.getOnCreateProps(scriptPath);
    this.OnWillCreate = UserDefinedTraitV1.getOnWillCreateProps(scriptPath);
  }

  private static getOnWillCreateProps(noteTypeScriptPath: string) {
    const hack = require(`./webpack-require-hack.js`);
    const req: NoteTrait = hack(noteTypeScriptPath);
    return req.OnWillCreate;
  }

  private static getOnCreateProps(noteTypeScriptPath: string) {
    const hack = require(`./webpack-require-hack.js`);
    const req: NoteTrait = hack(noteTypeScriptPath);
    return req.OnCreate;
  }
}
