import { DendronConfig, DendronApiV2 } from "@dendronhq/common-all";
import { createAsyncThunk, } from "@reduxjs/toolkit";
import { createLogger } from "@dendronhq/common-frontend";

export const configWrite = createAsyncThunk(
  "config/write",
  async ({ config, ws, port } : { config: DendronConfig, ws: string, port: number }, { rejectWithValue }) => {
    const logger = createLogger("configWriteThunk");
    const endpoint = `http://localhost:${port}`;
    logger.info({ state: "enter", endpoint});
    const api = new DendronApiV2({
      endpoint,
      apiPath: "api",
      logger,
    });
    logger.info({ state: "pre:configWrite" });
    const response = await api.configWrite({ config, ws });
    logger.info({ state: "post:configWrite" });
    if (response.error) {
      return rejectWithValue(response.error)
    }
  }
)
