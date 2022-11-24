import {
  axios,
  ConfigUtils,
  DVault,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { Git } from "@dendronhq/engine-server";
import { after, describe } from "mocha";
import os from "os";
import { performance } from "perf_hooks";
import { MoveNoteCommand } from "../../commands/MoveNoteCommand";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { RefactorHierarchyCommandV2 } from "../../commands/RefactorHierarchyV2";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { RenameNoteCommand } from "../../commands/RenameNoteCommand";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect } from "../testUtilsv2";
import { describeSingleWS } from "../testUtilsV3";

let perflogs: { [key: string]: number } = {};

suite("Performance testing", function () {
  describe("10000+ notes performance testing", () => {
    [false, true].forEach((enableEngineV3) => {
      describeSingleWS(
        `WHEN enableEngineV3 is ${enableEngineV3}`,
        {
          timeout: 1e6,
          preSetupHook: async ({ wsRoot }) => {
            const git = new Git({
              localUrl: wsRoot,
              remoteUrl:
                "https://github.com/dendronhq/10000-markdown-files.git",
            });
            await git.clone();
          },
          modConfigCb: (config) => {
            const newVault: DVault = {
              fsPath: "10000-markdown-files",
              selfContained: true,
            };
            const vaults = ConfigUtils.getVaults(config);
            vaults.push(newVault);
            config.workspace.vaults = vaults;
            config.dev!.enableEngineV3 = enableEngineV3;
            return config;
          },
          perflogs,
        },
        () => {
          after(async () => {
            console.log("******************************************");
            Object.keys(perflogs).forEach((log) => {
              console.log(log, "------------->", perflogs[log], "\n");
            });
            if (process.env.AIRTABLE_API_KEY) {
              const headers = {
                Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
              };
              const data = {
                records: [
                  {
                    fields: {
                      date: Time.now().toLocaleString(),
                      commitHash: process.env.GITHUB_SHA,
                      githubRef: process.env.GITHUB_REF,
                      testParameters: `enableEngineV3: ${enableEngineV3}`,
                      os: os.platform(),
                      ...perflogs,
                    },
                  },
                ],
              };
              await axios.post(
                `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/PerformanceData`,
                data,
                { headers }
              );
            }
            perflogs = {};
          });
          test("engine init duration", async () => {
            const engine = ExtensionProvider.getEngine();
            const start = performance.now();
            await engine.init();
            const end = performance.now();
            const engineInitDuration = end - start;
            perflogs.engineInitDuration = engineInitDuration;
          });
          test("THEN lookup returns correct results", async () => {
            const cmd = new NoteLookupCommand();
            const fname = "absorbed.distinguished.service.order";
            const start = performance.now();
            const out = await cmd.run({
              noConfirm: true,
              initialValue: "service.order",
            });
            const end = performance.now();
            const quickPick = out?.quickpick;
            const items = quickPick?.items.some((item) => item.fname === fname);
            perflogs.lookupDuration = end - start;
            cmd.cleanUp();
            expect(items).toBeTruthy();
          });
          test("Reload Index", async () => {
            const start = performance.now();
            await new ReloadIndexCommand().run();
            const end = performance.now();
            perflogs.reloadIndexDuration = end - start;
          });
          test("write note", async () => {
            const ws = ExtensionProvider.getDWorkspace();
            const { wsRoot, engine } = ws;
            const vaults = await ws.vaults;
            const newNote = await NoteTestUtilsV4.createNote({
              fname: "write-note",
              vault: vaults[0],
              wsRoot,
            });
            const start = performance.now();
            await engine.writeNote(newNote);
            const end = performance.now();
            perflogs.writeNoteDuration = end - start;
            const notes = await engine.findNotesMeta({ fname: "write-note" });
            expect(notes.length).toEqual(1);
          });
          test("update note", async () => {
            const { engine } = ExtensionProvider.getDWorkspace();
            const fname = "abiogenetic.nutlet";
            const noteToUpdate = (await engine.findNotes({ fname }))[0];
            noteToUpdate.title = "Update Note";
            const start = performance.now();
            await engine.writeNote(noteToUpdate);
            const end = performance.now();
            perflogs.updateNoteDuration = end - start;
            const updatedNote = (await engine.findNotesMeta({ fname }))[0];
            expect(updatedNote.title).toEqual("Update Note");
          });

          //Note Links: https://github.dev/dendronhq/10000-markdown-files/note-with-links.md
          test("render note with 20 links", async () => {
            const ws = ExtensionProvider.getDWorkspace();
            const { engine } = ws;
            const vaults = await ws.vaults;
            const fname = "note-with-links";
            const noteToRender = (
              await engine.findNotes({ fname, vault: vaults[1] })
            )[0];
            const start = performance.now();
            const resp = await engine.renderNote(noteToRender);
            const end = performance.now();
            perflogs.renderNoteWith20LinksDuration = end - start;
            expect(resp.error).toEqual(undefined);
            expect(resp.data).toNotEqual(undefined);
          });

          //Above note with 0 links: https://github.dev/dendronhq/10000-markdown-files/abiogenetic.nutlet.md
          test("render note with 0 links", async () => {
            const { engine } = ExtensionProvider.getDWorkspace();
            const fname = "abiogenetic.nutlet";
            const noteToRender = (await engine.findNotes({ fname }))[0];
            const start = performance.now();
            const resp = await engine.renderNote(noteToRender);
            const end = performance.now();
            perflogs.renderNoteDuration = end - start;
            expect(resp.error).toEqual(undefined);
            expect(resp.data).toNotEqual(undefined);
          });
          //https://github.dev/dendronhq/10000-markdown-files/a.cappella.magnetic.recorder.md
          test("render note with nested noteRefs", async () => {
            const { engine } = ExtensionProvider.getDWorkspace();
            const fname = "a.cappella.magnetic.recorder";
            const noteToRender = (await engine.findNotes({ fname }))[0];
            const start = performance.now();
            const resp = await engine.renderNote(noteToRender);
            const end = performance.now();
            perflogs.renderNoteWithNestedRefs = end - start;
            expect(resp.error).toEqual(undefined);
            expect(resp.data).toNotEqual(undefined);
          });
          //https://github.dev/dendronhq/10000-markdown-files/rich-formatting.md
          test("render note with rich formatting", async () => {
            const { engine } = ExtensionProvider.getDWorkspace();
            const fname = "rich-formatting";
            const noteToRender = (await engine.findNotes({ fname }))[0];
            const start = performance.now();
            const resp = await engine.renderNote(noteToRender);
            const end = performance.now();
            perflogs.renderNoteWithRichFormatting = end - start;
            expect(resp.error).toEqual(undefined);
            expect(resp.data).toNotEqual(undefined);
          });
          test("Move note to another vault", async () => {
            const ws = ExtensionProvider.getDWorkspace();
            const { engine } = ws;
            const vaults = await ws.vaults;
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            const fname = "above-mentioned.cerise";
            const note1 = (
              await engine.findNotes({
                fname,
                vault: vault2,
              })
            )[0];
            const extension = ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(note1);
            const cmd = new MoveNoteCommand(extension);
            const start = performance.now();
            await cmd.execute({
              moves: [
                {
                  oldLoc: {
                    fname,
                    vaultName: VaultUtils.getName(vault2),
                  },
                  newLoc: {
                    fname,
                    vaultName: VaultUtils.getName(vault1),
                  },
                },
              ],
            });
            const end = performance.now();
            perflogs.moveNoteAcrossVaultDuration = end - start;
            const notes = await engine.findNotesMeta({ fname });
            expect(notes.length).toEqual(1);
            expect(notes[0].vault).toEqual(vault1);
          });
          test("Refactor hierarchy", async () => {
            const ws = ExtensionProvider.getDWorkspace();
            const { engine } = ws;
            const vaults = await ws.vaults;
            const cmd = new RefactorHierarchyCommandV2();
            const fname = "aberrant.suspiciousness";
            const note = (
              await engine.findNotes({
                fname,
                vault: vaults[1],
              })
            )[0];
            const scope = {
              selectedItems: [
                {
                  ...note,
                  label: fname,
                },
              ],
              onAcceptHookResp: [],
            };

            const start = performance.now();
            await cmd.execute({
              scope,
              match: fname,
              replace: "refactor",
              noConfirm: true,
            });
            const end = performance.now();
            perflogs.refactorHierarchy = end - start;
            const notes = await engine.findNotesMeta({ fname });
            expect(notes.length).toEqual(0);
          });
          test("Rename Note", async () => {
            const ws = ExtensionProvider.getDWorkspace();
            const { engine } = ws;
            const vaults = await ws.vaults;
            const vault = vaults[1];
            const fname = "abkhazian.opcw";
            const newFname = "renamed-note";
            const note1 = (
              await engine.findNotes({
                fname,
                vault,
              })
            )[0];
            const extension = ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(note1);
            const cmd = new RenameNoteCommand(extension);
            const vaultName = VaultUtils.getName(vault);
            const start = performance.now();
            await cmd.execute({
              moves: [
                {
                  oldLoc: {
                    fname,
                    vaultName,
                  },
                  newLoc: {
                    fname: newFname,
                    vaultName,
                  },
                },
              ],
            });
            const end = performance.now();
            perflogs.renameNoteDuration = end - start;
            const note = (await engine.findNotesMeta({ fname: newFname }))[0];
            expect(note).toNotEqual(undefined);
            expect(note.vault).toEqual(vault);
          });
        }
      );
    });
  });
});
