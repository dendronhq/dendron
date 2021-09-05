import {
  DendronError,
  SchemaDeletePayload,
  SchemaDeleteRequest,
  SchemaQueryPayload,
  SchemaQueryRequest,
  SchemaUpdatePayload,
  SchemaUpdateRequest,
  SchemaWritePayload,
  SchemaWriteRequest,
} from "@dendronhq/common-all";
import { getWSEngine } from "../../utils";

export class SchemaController {
  static singleton?: SchemaController;

  static instance() {
    if (!SchemaController.singleton) {
      SchemaController.singleton = new SchemaController();
    }
    return SchemaController.singleton;
  }

  async create(req: SchemaWriteRequest): Promise<SchemaWritePayload> {
    const { ws, schema } = req;
    const engine = await getWSEngine({ ws });
    try {
      await engine.writeSchema(schema);
      return { error: null, data: undefined };
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async delete({
    ws,
    id,
    opts,
  }: SchemaDeleteRequest): Promise<SchemaDeletePayload> {
    const engine = await getWSEngine({ ws: ws || "" });
    try {
      const data = await engine.deleteSchema(id, opts);
      return data;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async query({ ws, qs }: SchemaQueryRequest): Promise<SchemaQueryPayload> {
    const engine = await getWSEngine({ ws: ws || "" });
    return await engine.querySchema(qs);
  }

  async update({
    ws,
    schema,
  }: SchemaUpdateRequest): Promise<SchemaUpdatePayload> {
    const engine = await getWSEngine({ ws: ws || "" });
    try {
      await engine.updateSchema(schema);
      return { error: null };
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
