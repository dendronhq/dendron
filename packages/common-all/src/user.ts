import { DendronUserSpecial } from "./types";
import { DVault } from "./typesv2";

export class DUser {
  constructor(public username: string) {}

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
