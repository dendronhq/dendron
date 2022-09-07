import {
  DeleteSchemaResp,
  QuerySchemaResp,
  SchemaDeleteRequest,
  SchemaQueryRequest,
  SchemaWriteRequest,
  WriteSchemaResp,
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

  async create(req: SchemaWriteRequest): Promise<WriteSchemaResp> {
    const { ws, schema } = req;
    const engine = await getWSEngine({ ws });
    return engine.writeSchema(schema);
  }

  async delete({
    ws,
    id,
    opts,
  }: SchemaDeleteRequest): Promise<DeleteSchemaResp> {
    const engine = await getWSEngine({ ws: ws || "" });
    return engine.deleteSchema(id, opts);
  }

  async query({ ws, qs }: SchemaQueryRequest): Promise<QuerySchemaResp> {
    const engine = await getWSEngine({ ws: ws || "" });
    return engine.querySchema(qs);
  }
}
