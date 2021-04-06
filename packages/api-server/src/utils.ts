import { DEngine } from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { MemoryStore } from "./store/memoryStore";

export function getWSKey(uri: string) {
  return _.trimEnd(uri, "/");
}

export async function putWS({
  ws,
  engine,
}: {
  ws: string;
  engine: DendronEngineV2;
}) {
  MemoryStore.instance().put(`ws:${getWSKey(ws)}`, engine);
}

export async function getWS({ ws }: { ws: string }) {
  const engine = await MemoryStore.instance().get<DEngine>(
    `ws:${getWSKey(ws)}`
  );
  if (!engine) {
    throw `No Engine: ${ws}`;
  }
  return engine;
}
