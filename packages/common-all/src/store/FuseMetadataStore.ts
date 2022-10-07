import { StatusCodes } from "http-status-codes";
import _ from "lodash";
import { ResultAsync } from "neverthrow";
import { SchemaUtils } from "../dnode";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import {
  NoteChangeEntry,
  NotePropsByIdDict,
  NotePropsMeta,
  RespV3,
  SchemaModuleDict,
  SchemaModuleProps,
} from "../types";
import { INoteQueryOpts, IQueryStore } from "./IDataQuery";
import { INoteMetadataStore } from "./IMetadataStore";

export class FuseMetadataStore implements IQueryStore, INoteMetadataStore {
  fuseEngine: FuseEngine;

  constructor(opts?: { fuzzThreshold: number }) {
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: _.defaults(opts, { fuzzThreshold: 0.2 }).fuzzThreshold,
    });
  }

  // @ts-ignore
  addSchemaToIndex(schema: SchemaModuleProps) {
    this.fuseEngine.schemaIndex.add(SchemaUtils.getModuleRoot(schema));
    return ResultAsync.fromSafePromise(Promise.resolve());
  }

  queryNotes(
    qs: string,
    opts: INoteQueryOpts
  ): ResultAsync<NotePropsMeta[], DendronError<StatusCodes | undefined>> {
    const items = this.fuseEngine.queryNote({
      qs,
      ...opts,
    }) as NotePropsMeta[];
    return ResultAsync.fromSafePromise(Promise.resolve(items));
  }

  querySchemas(
    qs: string
  ): ResultAsync<{ id: string }[], DendronError<StatusCodes | undefined>> {
    const schemaIds = this.fuseEngine.querySchema({ qs });
    return ResultAsync.fromSafePromise(Promise.resolve(schemaIds));
  }

  removeSchemaFromIndex(
    schema: SchemaModuleProps
  ): ResultAsync<void, DendronError> {
    this.fuseEngine.removeSchemaFromIndex(schema);
    return ResultAsync.fromSafePromise(Promise.resolve());
  }

  replaceNotesIndex(props: NotePropsByIdDict): ResultAsync<void, DendronError> {
    return ResultAsync.fromPromise(
      this.fuseEngine.replaceNotesIndex(props),
      (err) =>
        new DendronError({
          message: "issue replacing index",
          innerError: err as Error,
        })
    );
  }

  replaceSchemasIndex(
    props: SchemaModuleDict
  ): ResultAsync<void, DendronError> {
    return ResultAsync.fromPromise(
      this.fuseEngine.replaceSchemaIndex(props),
      (err) =>
        new DendronError({
          message: "issue replacing index",
          innerError: err as Error,
        })
    );
  }

  updateNotesIndex(
    changes: NoteChangeEntry[]
  ): ResultAsync<void, DendronError> {
    // @ts-ignore
    return ResultAsync.fromPromise(
      this.fuseEngine.updateNotesIndex(changes),
      (err) =>
        new DendronError({
          message: "issue updating index",
          innerError: err as Error,
        })
    );
  }
  updateSchemasIndex(): ResultAsync<
    void,
    DendronError<StatusCodes | undefined>
  > {
    throw new Error("Method not implemented.");
  }

  get(key: string): Promise<RespV3<NotePropsMeta>> {
    throw new Error("Method not implemented.");
  }
  find(opts: any): Promise<RespV3<NotePropsMeta[]>> {
    throw new Error("Method not implemented.");
  }
  write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    throw new Error("Method not implemented.");
  }
  delete(key: string): Promise<RespV3<string>> {
    throw new Error("Method not implemented.");
  }
}
