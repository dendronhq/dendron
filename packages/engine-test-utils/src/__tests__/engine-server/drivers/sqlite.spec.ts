import { NoteUtils } from "@dendronhq/common-all";
import { SQLiteMetadataStore } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import sinon from "sinon";
import { ENGINE_HOOKS, runEngineTestV5 } from "../../..";
import os from "os";

// currently not made for windows
const describeSkipWindows =
  os.platform() === "win32" ? describe.skip : describe;

describeSkipWindows("GIVEN sqlite store", () => {
  afterEach(async () => {
    await SQLiteMetadataStore.prisma().$disconnect();
  });
  jest.setTimeout(10e3);

  test("WHEN initialize, THEN metadata has all notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().note.findMany();
        expect(_.size(engine.notes)).toEqual(notes.length);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config) => {
          config.workspace.metadataStore = "sqlite";
          return config;
        },
      }
    );
  });

  test("WHEN initialize mult times, THEN metadata has all notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().note.findMany();
        expect(_.size(engine.notes)).toEqual(notes.length);

        const { error } = await engine.init();
        expect(error).toBeFalsy();
        const createAllSpy = sinon.spy(SQLiteMetadataStore, "createAllTables");
        expect(createAllSpy.calledOnce).toBeFalsy();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config) => {
          config.workspace.metadataStore = "sqlite";
          return config;
        },
      }
    );
  });

  test("WHEN initialize mult times and notes have changed, THEN metadata is updated", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const dirList = fs.readdirSync(wsRoot);
        expect(dirList).toMatchSnapshot();
        expect(dirList.includes("metadata.db")).toBeTruthy();
        const notes = await SQLiteMetadataStore.prisma().note.findMany();
        expect(_.size(engine.notes)).toEqual(notes.length);
        const newNote = NoteUtils.create({
          id: "new-note",
          fname: "new-note",
          vault: engine.vaults[0],
        });
        await engine.writeNote(newNote);

        const { error } = await engine.init();
        expect(error).toBeFalsy();
        const foundNote = await SQLiteMetadataStore.prisma().note.findFirst({
          where: { fname: "new-note" },
        });
        expect(foundNote?.fname).toEqual(newNote.fname);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
        modConfigCb: (config) => {
          config.workspace.metadataStore = "sqlite";
          return config;
        },
      }
    );
  });
});
