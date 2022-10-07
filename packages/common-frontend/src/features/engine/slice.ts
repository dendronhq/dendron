import {
  DendronApiV2,
  DEngineInitPayload,
  NoteProps,
  NotePropsByIdDict,
  stringifyError,
  NoteUtils,
  NoteFnameDictUtils,
  NoteDictsUtils,
  IntermediateDendronConfig,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { EngineSliceState, LoadingStatus } from "../../types";
import { createLogger } from "../../utils";
// @ts-ignore
import internal from "@reduxjs/toolkit/node_modules/immer/dist/internal";

/**
 * Equivalent to engine.init
 */
export const initNotes = createAsyncThunk(
  "engine/init",
  async ({ url, ws }: { url: string; ws: string }, { dispatch }) => {
    const logger = createLogger("initNotesThunk");
    const endpoint = url;
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    logger.info({ state: "pre:workspaceSync" });
    const resp = await api.workspaceSync({ ws });
    const schemaQueryResp = await api.schemaQuery({ qs: "*" });
    logger.info({ state: "post:workspaceSync" });
    if (resp.error) {
      dispatch(setError(stringifyError(resp.error)));
      return resp;
    }
    const data = resp.data!;
    logger.info({ state: "pre:setNotes" });

    const schemaDict: SchemaModuleDict = {};

    schemaQueryResp.data?.map((ent) => {
      schemaDict[ent.root.id] = ent;
    });

    dispatch(setFromInit({ ...data, schemas: schemaDict }));
    dispatch(setError(undefined));
    logger.info({ state: "post:setNotes" });
    return resp;
  }
);

/**
 * Syncs the Dendron config from the engine
 */
export const syncConfig = createAsyncThunk(
  "engine/syncConfig",
  async ({ url, ws }: { url: string; ws: string }, { dispatch }) => {
    const logger = createLogger("syncConfigThunk");
    const endpoint = url;
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    logger.info({ state: "pre:initConfig" });
    const resp = await api.configGet({ ws });
    logger.info({ state: "post:initConfig" });
    if (resp.error) {
      dispatch(setError(stringifyError(resp.error)));
      return resp;
    }
    const data = resp.data!;
    logger.info({ state: "pre:setConfig" });
    dispatch(setConfig(data));
    dispatch(setError(undefined));
    logger.info({ state: "post:setConfig" });
    return resp;
  }
);

export const syncNote = createAsyncThunk(
  "engine/sync",
  async (
    { url, ws, note }: { url: string; ws: string; note: NoteProps },
    { dispatch }
  ) => {
    const logger = createLogger("syncNoteThunk");
    const endpoint = url;
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    logger.info({ state: "pre:query" });
    const resp = await api.noteQuery({ qs: note.fname, ws, vault: note.vault });
    logger.info({ state: "post:query" });
    if (resp.error) {
      dispatch(setError(stringifyError(resp.error)));
      return resp;
    }
    const data = resp.data!;
    logger.debug({
      state: "pre:setNotes",
      // Logging notes, but avoiding it if there's too many notes to avoid any performance impact
      notes: data.length < 10 ? data.map(NoteUtils.toLogObj) : null,
    });
    if (data?.length) {
      dispatch(updateNote(data[0]));
      dispatch(setError(undefined));
    }
    logger.info({ state: "post:setNotes" });
    return resp;
  }
);

export const renderNote = createAsyncThunk(
  "engine/render",
  async (
    {
      url,
      ws,
      id,
      note,
    }: { url: string; ws: string; id: string; note?: NoteProps },
    { dispatch }
  ) => {
    const endpoint = url;
    const logger = createLogger("renderNoteThunk");
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    const resp = await api.noteRender({ id, ws, note });
    if (resp.error) {
      dispatch(setError(stringifyError(resp.error)));
      return resp;
    }
    const data = resp.data!;
    dispatch(setRenderNote({ id, body: data }));
    dispatch(setError(undefined));
    return resp;
  }
);

export type InitNoteOpts = Parameters<typeof initNotes>[0];

type InitialState = InitializedState;
type InitializedState = EngineSliceState & {
  notesRendered: { [key: string]: string | undefined };
};
const initialState: InitialState = {
  loading: LoadingStatus.IDLE,
  currentRequestId: undefined,
  vaults: [],
  notes: {},
  noteFName: {},
  schemas: {},
  notesRendered: {},
  error: null,
};

export type EngineState = InitializedState;
export const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setFromInit: (
      state,
      action: PayloadAction<DEngineInitPayload & { schemas: SchemaModuleDict }>
    ) => {
      const { notes, wsRoot, schemas, vaults, config } = action.payload;
      state.notes = notes;
      state.wsRoot = wsRoot;
      state.schemas = schemas;
      state.vaults = vaults;
      state.config = config;
      state.noteFName = NoteFnameDictUtils.createNotePropsByFnameDict(notes);
    },
    setConfig: (state, action: PayloadAction<IntermediateDendronConfig>) => {
      state.config = action.payload;
    },
    setNotes: (state, action: PayloadAction<NotePropsByIdDict>) => {
      state.notes = action.payload;
    },
    setError: (state, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    /**
     * Reset all state
     */
    tearDown: (state) => {
      state.loading = LoadingStatus.IDLE;
      state.currentRequestId = undefined;
      state.vaults = [];
      state.notes = {};
      state.schemas = {};
      state.notesRendered = {};
      state.error = null;
      state.noteFName = {};
    },
    setRenderNote: (
      state,
      action: PayloadAction<{ id: string; body: string }>
    ) => {
      const { id, body } = action.payload;
      state.notesRendered[id] = body;
    },
    updateNote: (state, action: PayloadAction<NoteProps>) => {
      const note = action.payload;
      if (!state.notes) {
        state.notes = {};
      }
      // this is a new node
      const noteDicts = {
        notesById: state.notes,
        notesByFname: state.noteFName,
      };
      if (!state.notes[note.id]) {
        const changed = NoteUtils.addOrUpdateParents({
          note,
          noteDicts,
          createStubs: true,
        });
        changed.forEach((noteChangeEntry) =>
          NoteDictsUtils.add(noteChangeEntry.note, noteDicts)
        );
      }
      NoteDictsUtils.add(note, noteDicts);
    },
  },
  extraReducers: (builder) => {
    const logger = createLogger("engineSlice");
    builder.addCase(initNotes.pending, (state, { meta }) => {
      logger.info({ state: "start:initNotes", requestId: meta.requestId });
      if (state.loading === "idle") {
        state.loading = LoadingStatus.PENDING;
        state.currentRequestId = meta.requestId;
      }
    });
    builder.addCase(initNotes.fulfilled, (state, { meta }) => {
      const { requestId } = meta;
      logger.info({
        state: "fin:initNotes",
        requestId: state.currentRequestId,
      });
      if (state.loading === "pending" && state.currentRequestId === requestId) {
        state.loading = LoadingStatus.IDLE;
        state.currentRequestId = undefined;
      }
    });
  },
});

export const {
  setNotes,
  setError,
  setFromInit,
  setConfig,
  setRenderNote,
  updateNote,
  tearDown,
} = engineSlice.actions;
export const reducer = engineSlice.reducer;
