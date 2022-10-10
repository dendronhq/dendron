import { ENGINE_CONFIG_PRESETS } from "./config";
import { ENGINE_DELETE_PRESETS } from "./delete";
import { ENGINE_INFO_PRESETS } from "./info";
import { ENGINE_INIT_PRESETS } from "./init";
import { ENGINE_GET_NOTE_BLOCKS_PRESETS } from "./getNoteBlocks";
import NOTE_REF from "./note-refs";
import { ENGINE_QUERY_PRESETS } from "./query";
import { ENGINE_RENAME_PRESETS } from "./rename";
import { ENGINE_BULK_WRITE_NOTES_PRESETS } from "./bulkWriteNotes";
import { ENGINE_RENDER_PRESETS } from "./render";
import { ENGINE_WRITE_PRESETS, ENGINE_WRITE_PRESETS_MULTI } from "./write";
import _ from "lodash";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";

export { ENGINE_HOOKS, ENGINE_HOOKS_BASE, ENGINE_HOOKS_MULTI } from "./utils";
export { ENGINE_RENAME_PRESETS };
export { ENGINE_QUERY_PRESETS };
export { ENGINE_WRITE_PRESETS };
export { ENGINE_CONFIG_PRESETS };

export const ENGINE_SERVER = {
  NOTE_REF,
  ENGINE_WRITE_PRESETS,
  ENGINE_INIT_PRESETS,
  ENGINE_DELETE_PRESETS,
  ENGINE_INFO_PRESETS,
  ENGINE_RENAME_PRESETS,
  ENGINE_GET_NOTE_BLOCKS_PRESETS,
  ENGINE_QUERY_PRESETS,
  ENGINE_BULK_WRITE_NOTES_PRESETS,
  ENGINE_RENDER_PRESETS,
};

type TestPresetEntry = TestPresetEntryV4;
type TestPresetDict = { [key: string]: TestPresetEntry };

/**
 * 
 @example
 *  test("", async () => {
 *    const TestCase= getPreset({presets: ENGINE_PRESETS, nodeType, presetName: "init", key: 'BAD_SCHEMA'})
 *    const { testFunc, ...opts } = TestCase;;
 *    await runEngineTestV5(testFunc, { ...opts, expect });
 *});
 * @param param0 
 * @returns 
 */
export const getPreset = ({
  presets,
  presetName,
  nodeType,
  key,
}: {
  presets: typeof ENGINE_PRESETS;
  presetName: string;
  nodeType: "SCHEMAS" | "NOTES";
  key: string;
}) => {
  const ent = _.find(presets, { name: presetName })!;
  // @ts-ignore
  const out = _.get(ent.presets[nodeType], key);
  if (!out) {
    throw Error(`no key ${key} found in ${presetName}`);
  }
  return out;
};

export const getPresetMulti = ({
  presets,
  presetName,
  nodeType,
  key,
}: {
  presets: typeof ENGINE_PRESETS_MULTI;
  presetName: string;
  nodeType: "NOTES";
  key: string;
}) => {
  const ent = _.find(presets, { name: presetName })!;
  // @ts-ignore
  const out = _.get(ent.presets[nodeType], key);
  if (!out) {
    throw Error(`no key ${key} found in ${presetName}`);
  }
  return out;
};

export const getPresetGroup = ({
  presets,
  presetName,
  nodeType,
}: {
  presets: typeof ENGINE_PRESETS;
  presetName: string;
  nodeType: "SCHEMAS" | "NOTES";
}) => {
  const ent = _.find(presets, { name: presetName })!;
  // @ts-ignore
  return ent.presets[nodeType] as TestPresetDict;
};

// ^iygzn9r2758w
export const ENGINE_PRESETS = [
  { name: "write", presets: ENGINE_SERVER.ENGINE_WRITE_PRESETS },
  {
    name: "bulkWriteNotes",
    presets: ENGINE_SERVER.ENGINE_BULK_WRITE_NOTES_PRESETS,
  },
  { name: "delete", presets: ENGINE_SERVER.ENGINE_DELETE_PRESETS },
  { name: "rename", presets: ENGINE_SERVER.ENGINE_RENAME_PRESETS },
  { name: "init", presets: ENGINE_SERVER.ENGINE_INIT_PRESETS },
  { name: "query", presets: ENGINE_SERVER.ENGINE_QUERY_PRESETS },
  { name: "info", presets: ENGINE_SERVER.ENGINE_INFO_PRESETS },
  {
    name: "getNoteBlocks",
    presets: ENGINE_SERVER.ENGINE_GET_NOTE_BLOCKS_PRESETS,
  },
  { name: "render", presets: ENGINE_SERVER.ENGINE_RENDER_PRESETS },
];

export const ENGINE_PRESETS_MULTI = [
  { name: "write", presets: ENGINE_WRITE_PRESETS_MULTI },
  { name: "delete", presets: ENGINE_SERVER.ENGINE_DELETE_PRESETS },
  { name: "rename", presets: ENGINE_SERVER.ENGINE_RENAME_PRESETS },
  { name: "init", presets: ENGINE_SERVER.ENGINE_INIT_PRESETS },
  { name: "query", presets: ENGINE_SERVER.ENGINE_QUERY_PRESETS },
];
