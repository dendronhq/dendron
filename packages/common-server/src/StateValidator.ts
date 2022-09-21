import {
  DendronError,
  DEngineClient,
  ErrorFactory,
  NoteDictsUtils,
  RespV3,
  TreeUtils,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import path from "path";
import { getAllFiles } from "./files";
import { vault2Path } from "./filesv2";

/**
 * Validate correctness of engine notes compared with filesystem.
 * Currently supports parent/children relationship between notes
 */
export class StateValidator {
  static validateEngineState(engine: DEngineClient): Promise<RespV3<void>[]> {
    return Promise.all(
      engine.vaults.map(async (vault) => {
        const rootNote = (
          await engine.findNotesMeta({ fname: "root", vault })
        )[0];
        try {
          if (rootNote) {
            const engineNotes = await engine.findNotes({ excludeStub: true });
            const engineTreeNode = TreeUtils.createTreeFromEngine(
              NoteDictsUtils.createNotePropsByIdDict(engineNotes),
              rootNote.id
            );

            const vpath = vault2Path({ vault, wsRoot: engine.wsRoot });
            const out = await getAllFiles({
              root: URI.file(vpath),
              include: ["*.md"],
            });

            if (out.error) {
              return { error: out.error };
            }

            if (out.data) {
              const allFnames = out.data.map(
                (filePath) => path.parse(filePath).name
              );

              const fileTreeNode = TreeUtils.createTreeFromFileNames(
                allFnames,
                "root"
              );
              const resp = TreeUtils.validateTreeNodes(
                fileTreeNode,
                engineTreeNode
              );
              if (resp.error) {
                return {
                  error: new DendronError({
                    message: `Vault "${VaultUtils.getName(vault)}" mismatch. ${
                      resp.error.message
                    }`,
                  }),
                };
              }
              return { data: undefined };
            } else {
              return {
                error: new DendronError({
                  message: `No files found from vault "${VaultUtils.getName(
                    vault
                  )}"`,
                }),
              };
            }
          } else {
            return {
              error: new DendronError({
                message: `Root file from vault "${VaultUtils.getName(
                  vault
                )}" is missing.`,
              }),
            };
          }
        } catch (error: any) {
          const dendronError = ErrorFactory.wrapIfNeeded(error);
          return {
            error: dendronError,
          };
        }
      })
    );
  }
}
