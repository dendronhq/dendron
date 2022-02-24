import {
  DendronApiV2,
  DEngineInitPayload,
  NoteProps,
  NotePropsDict,
  stringifyError,
  APIUtils,
  NoteUtils,
  ConfigGetPayload,
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
  async ({ port, ws }: { port: number; ws: string }, { dispatch }) => {
    const logger = createLogger("initNotesThunk");
    const endpoint = APIUtils.getLocalEndpoint(port);
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    logger.info({ state: "pre:workspaceSync" });
    const resp = await api.workspaceSync({ ws });
    logger.info({ state: "post:workspaceSync" });
    if (resp.error) {
      dispatch(setError(stringifyError(resp.error)));
      return resp;
    }
    const data = resp.data!;
    logger.info({ state: "pre:setNotes" });
    dispatch(setFromInit(data));
    logger.info({ state: "post:setNotes" });
    return resp;
  }
);

/**
 * Syncs the Dendron config from the engine
 */
export const syncConfig = createAsyncThunk(
  "engine/syncConfig",
  async ({ port, ws }: { port: number; ws: string }, { dispatch }) => {
    const logger = createLogger("syncConfigThunk");
    const endpoint = APIUtils.getLocalEndpoint(port);
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
    logger.info({ state: "post:setConfig" });
    return resp;
  }
);

export const syncNote = createAsyncThunk(
  "engine/sync",
  async (
    { port, ws, note }: { port: number; ws: string; note: NoteProps },
    { dispatch }
  ) => {
    const logger = createLogger("syncNoteThunk");
    const endpoint = APIUtils.getLocalEndpoint(port);
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
    logger.info({ state: "pre:setNotes" });
    if (data?.length) {
      dispatch(updateNote(data[0]));
    }
    logger.info({ state: "post:setNotes" });
    return resp;
  }
);

export const renderNote = createAsyncThunk(
  "engine/render",
  async (
    {
      port,
      ws,
      id,
      note,
    }: { port: number; ws: string; id: string; note?: NoteProps },
    { dispatch }
  ) => {
    const endpoint = APIUtils.getLocalEndpoint(port);
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
  schemas: {},
  notesRendered: {},
  error: null,
};

export type EngineState = InitializedState;
export const engineSlice = createSlice({
  name: "engine",
  initialState,
  reducers: {
    setFromInit: (state, action: PayloadAction<DEngineInitPayload>) => {
      const { notes, wsRoot, schemas, vaults, config } = action.payload;
      state.notes = notes;
      state.wsRoot = wsRoot;
      state.schemas = schemas;
      state.vaults = vaults;
      state.config = config;
    },
    setConfig: (state, action: PayloadAction<ConfigGetPayload>) => {
      state.config = action.payload;
    },
    setNotes: (state, action: PayloadAction<NotePropsDict>) => {
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
      if (!state.notes[note.id]) {
        NoteUtils.addOrUpdateParents({
          note,
          notesList: _.values(state.notes),
          createStubs: true,
          wsRoot: state.wsRoot!,
        });
      }
      state.notes[note.id] = note;
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
