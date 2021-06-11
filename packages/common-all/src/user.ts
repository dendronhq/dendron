import { DendronUserSpecial, DVault } from "./types";

export class DUser {
  public username: string;
  constructor(username: string) {
    this.username = username;
  }

  static createAnonymous() {
    return new DUser(DendronUserSpecial.anonymous);
  }

  canPushVault(vault: DVault) {
    if (vault.noAutoPush) {
      return false;
    }
    if (!vault.userPermission) {
      return true;
    }
    if (
      vault.userPermission.write[0] === DendronUserSpecial.everyone ||
      vault.userPermission.write.includes(this.username)
    ) {
      return true;
    }
    return false;
  }
}
