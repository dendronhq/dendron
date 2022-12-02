import {
  Awaited,
  ConfigService,
  ConfigUtils,
  DVault,
  NoteUtils,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import { findNonNoteFile } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";
import vscode, { Location, Position, Uri } from "vscode";
import { findAnchorPos, GotoNoteCommand } from "../commands/GotoNote";
import { TargetKind } from "../commands/GoToNoteInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { getReferenceAtPosition } from "../utils/md";

export default class DefinitionProvider implements vscode.DefinitionProvider {
  private async maybeNonNoteFileDefinition({
    fpath,
    vault,
  }: {
    fpath: string;
    vault?: DVault;
  }) {
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const file = await findNonNoteFile({
      fpath,
      vaults: vault ? [vault] : vaults,
      wsRoot,
    });
    return file?.fullPath;
  }

  private async provideForNonNoteFile(nonNoteFile: string) {
    return new Location(Uri.file(nonNoteFile), new Position(0, 0));
  }

  private async provideForNewNote(
    refAtPos: NonNullable<Awaited<ReturnType<typeof getReferenceAtPosition>>>
  ) {
    const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const noAutoCreateOnDefinition =
      !ConfigUtils.getWorkspace(config).enableAutoCreateOnDefinition;
    if (noAutoCreateOnDefinition) {
      return;
    }
    const out = await new GotoNoteCommand(
      ExtensionProvider.getExtension()
    ).execute({
      qs: refAtPos.ref,
      anchor: refAtPos.anchorStart,
    });
    if (out?.kind !== TargetKind.NOTE) {
      // Wasn't able to create, or not a note file
      return;
    }
    const { note, pos } = out;
    return new Location(
      NoteUtils.getURI({ note, wsRoot }),
      pos || new Position(0, 0)
    );
  }

  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[] | undefined> {
    try {
      // No-op if we're not in a Dendron Workspace
      if (
        !(await ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))
      ) {
        return;
      }

      const ws = ExtensionProvider.getDWorkspace();
      const { wsRoot, engine } = ws;
      const vaults = await ws.vaults;
      const refAtPos = await getReferenceAtPosition({
        document,
        position,
        wsRoot,
        vaults,
      });
      if (!refAtPos) {
        return;
      }
      let vault;
      if (refAtPos.vaultName) {
        try {
          vault = VaultUtils.getVaultByName({
            vaults: engine.vaults,
            vname: refAtPos.vaultName,
          });
        } catch (err) {
          Logger.error({ msg: `${refAtPos.vaultName} is not defined` });
        }
      }
      const notes = (
        await engine.findNotesMeta({ fname: refAtPos.ref, vault })
      ).filter((note) => !note.id.startsWith(NoteUtils.FAKE_ID_PREFIX));
      const uris = notes.map((note) => NoteUtils.getURI({ note, wsRoot }));
      const out = uris.map((uri) => new Location(uri, new Position(0, 0)));
      if (out.length > 1) {
        return out;
      } else if (out.length === 1) {
        const loc = out[0];
        if (refAtPos.anchorStart) {
          const pos = findAnchorPos({
            anchor: refAtPos.anchorStart,
            note: notes[0],
          });
          return new Location(loc.uri, pos);
        }
        return loc;
      } else {
        // if no note exists, check if it's a non-note file
        const nonNoteFile = await this.maybeNonNoteFileDefinition({
          fpath: refAtPos.ref,
          vault,
        });

        if (nonNoteFile) return this.provideForNonNoteFile(nonNoteFile);
        else return this.provideForNewNote(refAtPos);
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
}
