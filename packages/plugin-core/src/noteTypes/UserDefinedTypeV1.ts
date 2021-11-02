/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import {
  NoteType,
  onCreateProps,
  onWillCreateProps,
} from "@dendronhq/common-all";

/**
 * A NoteType that will execute end-user defined javascript code. TODO: Support
 * hot reload (user doesn't need to reload window in order for their changes to
 * take effect)
 */
export class UserDefinedTypeV1 implements NoteType {
  id: string;
  getTemplateType: any;
  scriptPath: string;

  onCreate?: onCreateProps;
  onWillCreate?: onWillCreateProps;

  /**
   *
   * @param typeId ID for the note type
   * @param scriptPath - path to the .js file that will be dynamically run
   */
  constructor(typeId: string, scriptPath: string) {
    this.id = typeId;
    this.scriptPath = scriptPath;

    this.onCreate = UserDefinedTypeV1.getOnCreateProps(scriptPath);
    this.onWillCreate = UserDefinedTypeV1.getOnWillCreateProps(scriptPath);
  }

  private static getOnWillCreateProps(noteTypeScriptPath: string) {
    const req: NoteType = require(noteTypeScriptPath);
    return req.onWillCreate;
  }

  private static getOnCreateProps(noteTypeScriptPath: string) {
    const req: NoteType = require(noteTypeScriptPath);
    return req.onCreate;
  }
}
