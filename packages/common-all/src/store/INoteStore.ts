import { ResultAsync } from "neverthrow";
import { IDendronError } from "../error";
import {
  Disposable,
  DNoteLoc,
  NoteProps,
  NotePropsMeta,
  QueryNotesOpts,
  RespV3,
  WriteNoteMetaOpts,
  WriteNoteOpts,
} from "../types";
import { FindNoteOpts } from "../types/FindNoteOpts";

/**
 * Interface responsible for interacting with NoteProps storage layer
 */
export interface INoteStore<K> extends Disposable {
  /**
   * Get NoteProps by key
   * If key is not found, return error.
   *
   * @param key: key of NoteProps
   * @return NoteProps
   */
  get(key: K): Promise<RespV3<NoteProps>>;

  /**
   * Bulk get NoteProps by list of key
   * If no notes are found, return empty list.
   *
   * @param key: keys of NoteProps
   * @return list of NoteProps
   */
  bulkGet(keys: K[]): Promise<RespV3<NoteProps>[]>;

  /**
   * Get NoteProps metadata by key
   * If key is not found, return error.
   *
   * @param key: key of NoteProps
   * @return NoteProps metadata
   */
  getMetadata(key: K): Promise<RespV3<NotePropsMeta>>;

  /**
   * Bulk get NoteProps metadata by list of key
   * If no notes are found, return empty list.
   *
   * @param key: keys of NoteProps
   * @return list of NoteProps metadata
   */
  bulkGetMetadata(keys: K[]): Promise<RespV3<NotePropsMeta>[]>;

  /**
   * Find NoteProps by criteria. If no criteria is set, return empty array.
   * If multiple criterias are set, find NoteProps that matches all criteria
   *
   * @param opts: NoteProps find criteria
   * @return List of NoteProps that matches criteria
   */
  find(opts: FindNoteOpts): Promise<RespV3<NoteProps[]>>;

  /**
   * Find NoteProps metadata by criteria. If no criteria is set, return empty array.
   * If multiple criterias are set, find NoteProps that matches all criteria
   *
   * @param opts: NoteProps criteria
   * @return List of NoteProps metadata that matches criteria
   */
  findMetaData(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>>;

  /**
   * Write NoteProps to storage layer for given key, overriding existing NoteProps if it already exists
   *
   * @param opts: NoteProps write criteria
   * @return original key
   */
  write(opts: WriteNoteOpts<K>): Promise<RespV3<K>>;

  /**
   * Write NoteProps metadata to storage layer for given key, overriding existing NoteProps metadata if it already exists
   * Unlike {@link INoteStore.write}, this will not touch the filesystem
   *
   * @param opts: NoteProps write criteria
   * @return original key
   */
  writeMetadata(opts: WriteNoteMetaOpts<K>): Promise<RespV3<K>>;

  /**
   * Bulk write NoteProps metadata to storage layer for given key, overriding existing NoteProps metadata if it already exists
   *
   * @param opts: NoteProps write criteria array
   * @return original key array
   */
  bulkWriteMetadata(opts: WriteNoteMetaOpts<K>[]): Promise<RespV3<K>[]>;

  /**
   * Delete NoteProps from storage layer for given key.
   * If key does not exist, do nothing.
   *
   * @param key: key of NoteProps to delete
   * @return original key
   */
  delete(key: K): Promise<RespV3<string>>;

  /**
   * Delete NoteProps metadata from storage layer for given key.
   * If key does not exist, do nothing.
   * Unlike {@link INoteStore.delete}, this will not touch the filesystem
   *
   * @param key: key of NoteProps to delete
   * @return original key
   */
  deleteMetadata(key: K): Promise<RespV3<string>>;

  /**
   * Rename location of NoteProps
   * If old location does not exist, return error.
   *
   * @param oldLoc: old location of NoteProps to rename
   * @param newLoc: new location of NoteProps to rename
   * @return key of NoteProps to rename
   */
  rename(oldLoc: DNoteLoc, newLoc: DNoteLoc): Promise<RespV3<K>>;

  /**
   * Query NoteProps by criteria. Differs from find in that this supports full-text fuzzy search
   * on note properties.
   *
   * @param opts: NoteProps criteria
   * @return List of NoteProps that matches criteria
   */
  query(opts: QueryNotesOpts): ResultAsync<NoteProps[], IDendronError>;

  /**
   * Query NoteProps metadata by criteria. Differs from find in that this supports full-text fuzzy search
   * on note properties.
   * TODO: consider replacing findMetadata altogether
   *
   * @param opts: NotePropsMeta criteria
   * @return List of NoteProps metadata that matches criteria
   */
  queryMetadata(
    opts: QueryNotesOpts
  ): ResultAsync<NotePropsMeta[], IDendronError>;
}
