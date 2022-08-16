import {
  DVault,
  NoteProps,
  NoteUtils,
  vault2Path,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";

/**
 * Return hash of written file - this is the vscode version of note2File of common-server
 */
export async function note2File({
  note,
  vault,
  wsRoot,
}: {
  note: NoteProps;
  vault: DVault;
  wsRoot: URI;
}) {
  const { fname } = note;
  const ext = ".md";
  const payload = NoteUtils.serialize(note, { excludeStub: true });
  const vaultPath = vault2Path({ vault, wsRoot });
  await vscode.workspace.fs.writeFile(
    Utils.joinPath(vaultPath, fname + ext),
    new Uint8Array(Buffer.from(payload, "utf-8"))
  );
}
