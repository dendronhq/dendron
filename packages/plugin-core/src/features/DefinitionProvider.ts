import {
  ConfigUtils,
  DVault,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import vscode, { Location, Position, Uri } from "vscode";
import {
  findAnchorPos,
  GotoNoteCommand,
  TargetKind,
} from "../commands/GotoNote";
import { Logger } from "../logger";
import { getReferenceAtPosition } from "../utils/md";
import { DendronExtension, getDWorkspace } from "../workspace";
import * as Sentry from "@sentry/node";
import { findNonNoteFile } from "@dendronhq/common-server";

export default class DefinitionProvider implements vscode.DefinitionProvider {
  private async maybeNonNoteFileDefinition({
    fpath,
    vault,
  }: {
    fpath: string;
    vault?: DVault;
  }) {
    const { wsRoot, vaults } = getDWorkspace();
    const file = await findNonNoteFile({
      fpath,
      vaults: vault ? [vault] : vaults,
      wsRoot,
    });
    return file?.fullPath;
  }

  private async provideForNonNoteFile(nonNoteFile: string) {
    const out = await new GotoNoteCommand().execute({
      qs: nonNoteFile,
      kind: TargetKind.NON_NOTE,
    });
    // Wasn't able to create
    if (out?.kind !== TargetKind.NON_NOTE) return;
    return new Location(Uri.file(out.fullPath), new Position(0, 0));
  }

  private async provideForNewNote(
    refAtPos: NonNullable<ReturnType<typeof getReferenceAtPosition>>
  ) {
    const config = getDWorkspace().config;
    const noAutoCreateOnDefinition =
      !ConfigUtils.getWorkspace(config).enableAutoCreateOnDefinition;
    if (noAutoCreateOnDefinition) {
      return;
    }
    const out = await new GotoNoteCommand().execute({
      qs: refAtPos.ref,
      anchor: refAtPos.anchorStart,
    });
    if (out?.kind !== TargetKind.NOTE) {
      // Wasn't able to create, or not a note file
      return;
    }
    const { note, pos } = out;
    return new Location(
      Uri.file(NoteUtils.getFullPath({ note, wsRoot: getDWorkspace().wsRoot })),
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
      if (!DendronExtension.isActive()) {
        return;
      }
      const refAtPos = getReferenceAtPosition(document, position);
      if (!refAtPos) {
        return;
      }
      let vault;
      const { engine } = getDWorkspace();
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
      const notes = NoteUtils.getNotesByFname({
        fname: refAtPos.ref,
        notes: engine.notes,
        vault,
      });
      const uris = notes.map((note) =>
        Uri.file(
          NoteUtils.getFullPath({ note, wsRoot: getDWorkspace().wsRoot })
        )
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
