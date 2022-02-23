import {
  Awaited,
  ConfigUtils,
  DVault,
  NoteUtils,
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
import { getExtension } from "../workspace";

export default class DefinitionProvider implements vscode.DefinitionProvider {
  private async maybeNonNoteFileDefinition({
    fpath,
    vault,
  }: {
    fpath: string;
    vault?: DVault;
  }) {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const file = await findNonNoteFile({
      fpath,
      vaults: vault ? [vault] : vaults,
      wsRoot,
    });
    return file?.fullPath;
  }

  private async provideForNonNoteFile(nonNoteFile: string) {
    const out = await new GotoNoteCommand(getExtension()).execute({
      qs: nonNoteFile,
      kind: TargetKind.NON_NOTE,
    });
    // Wasn't able to create
    if (out?.kind !== TargetKind.NON_NOTE) return;
    return new Location(Uri.file(out.fullPath), new Position(0, 0));
  }

  private async provideForNewNote(
    refAtPos: NonNullable<Awaited<ReturnType<typeof getReferenceAtPosition>>>
  ) {
    const wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
    const config = ExtensionProvider.getEngine().config;
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
      Uri.file(NoteUtils.getFullPath({ note, wsRoot })),
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

      const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
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
      const notes = NoteUtils.getNotesByFnameFromEngine({
        fname: refAtPos.ref,
        engine,
        vault,
      });
      const uris = notes.map((note) =>
        Uri.file(NoteUtils.getFullPath({ note, wsRoot }))
      );
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
