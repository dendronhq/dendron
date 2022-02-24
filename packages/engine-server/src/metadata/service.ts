import { Time } from "@dendronhq/common-all";
import fs from "fs-extra";
import os from "os";
import path from "path";

type Metadata = Partial<{
  /**
   * When was dendron first installed
   */
  firstInstall: number;
  /**
   * When the first workspace was initialized
   */
  firstWsInitialize: number;
  /**
   * When the last time the lapsed user message was displayed to the user
   */
  lapsedUserMsgSendTime: number;
  /**
   * When the last time the inactive user message was displayed to the user
   */
  inactiveUserMsgSendTime: number;
  /**
   * Set if a user has activated a dendron workspace
   */
  dendronWorkspaceActivated: number;
  /**
   * When the user first used lookup
   */
  firstLookupTime: number;
  /**
   * When the user last used lookup
   */
  lastLookupTime: number;
}>;

let _singleton: MetadataService | undefined;

export class MetadataService {
  static instance() {
    if (!_singleton) {
      _singleton = new MetadataService();
    }
    return _singleton;
  }

  static metaFilePath() {
    return path.join(os.homedir(), ".dendron", "meta.json");
  }

  deleteMeta(key: keyof Metadata) {
    const stateFromFile = this.getMeta();
    delete stateFromFile[key];
    fs.writeJSONSync(MetadataService.metaFilePath(), stateFromFile, {
      spaces: 4,
    });
  }

  getMeta(): Metadata {
    const metaPath = MetadataService.metaFilePath();
    if (!fs.pathExistsSync(metaPath)) {
      fs.ensureFileSync(metaPath);
      fs.writeJSONSync(metaPath, {});
      return {};
    }
    return fs.readJSONSync(MetadataService.metaFilePath()) as Metadata;
  }

  setMeta(key: keyof Metadata, value: any) {
    const stateFromFile = this.getMeta();
    stateFromFile[key] = value;
    fs.writeJSONSync(MetadataService.metaFilePath(), stateFromFile, {
      spaces: 4,
    });
  }

  /**
   * Set first install logic
   *  ^o4y7ijuvi5nv
   */
  setInitialInstall(time?: number) {
    time ||= Time.now().toSeconds();
    return this.setMeta("firstInstall", time);
  }

  setFirstWsInitialize() {
    return this.setMeta("firstWsInitialize", Time.now().toSeconds());
  }

  setLapsedUserMsgSendTime() {
    return this.setMeta("lapsedUserMsgSendTime", Time.now().toSeconds());
  }

  setDendronWorkspaceActivated() {
    return this.setMeta("dendronWorkspaceActivated", Time.now().toSeconds());
  }

  setFirstLookupTime() {
    return this.setMeta("firstLookupTime", Time.now().toSeconds());
  }

  setLastLookupTime() {
    return this.setMeta("lastLookupTime", Time.now().toSeconds());
  }

  setInactiveUserMsgSendTime() {
    return this.setMeta("inactiveUserMsgSendTime", Time.now().toSeconds());
  }
}
